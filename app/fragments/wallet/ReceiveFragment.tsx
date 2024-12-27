import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { View, Text, Pressable, ScrollView, Platform, Alert, useWindowDimensions } from "react-native";
import { t } from "../../i18n/t";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { WImage } from "../../components/WImage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { captureRef } from 'react-native-view-shot';
import { useNetwork, useBounceableWalletFormat, useSelectedAccount, useTheme, useVerifyJetton, useJetton, useHoldersAccounts, useJettonContent } from "../../engine/hooks";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { AssetViewType } from "./AssetsFragment";
import { mapHoldersAccountTarget } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import { getAccountName } from "../../utils/holders/getAccountName";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { copyText } from "../../utils/copyText";
import { GeneralHoldersAccount, GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import Share from 'react-native-share';
import { ItemDivider } from "../../components/ItemDivider";
import { AddressComponent } from "../../components/address/AddressComponent";
import { hasDirectDeposit } from "../../utils/holders/hasDirectDeposit";
import { HoldersAccountCard } from "../../components/products/HoldersAccountCard";

import CopyIcon from '@assets/ic-copy.svg';
import FromExchangeIcon from '@assets/ic-from-exchange.svg';
import ShareIcon from '@assets/ic-share.svg';

type ReceiveableAssetContent = {
    icon: string | null | undefined;
    name: string | null | undefined;
}

export type ReceiveableAsset = {
    address: Address;
    content?: ReceiveableAssetContent;
    holders?: GeneralHoldersAccount
}

export type ReceiveFragmentParams = {
    addr?: string;
    ledger?: boolean;
    asset?: ReceiveableAsset;
}

const qrSize = 262;

export const ReceiveFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const imageRef = useRef<View>(null);
    const { addr, ledger, asset: initAsset } = useParams<ReceiveFragmentParams>();
    const selected = useSelectedAccount();
    const [bounceableFormat] = useBounceableWalletFormat();
    const toaster = useToaster();
    const dimensions = useWindowDimensions();

    const address = useMemo(() => {
        if (addr) {
            try {
                const parsed = Address.parseFriendly(addr);
                return parsed.address;
            } catch {
                Alert.alert(t('common.error'), t('transfer.error.invalidAddress'));
            }
        }
        return selected!.address;
    }, [selected, addr]);

    const holdersAccounts = useHoldersAccounts(address).data?.accounts?.filter(acc => hasDirectDeposit(acc));
    const defaultAccount = holdersAccounts?.[0];
    const holdersTarget = defaultAccount ? mapHoldersAccountTarget(defaultAccount) : undefined;
    const defaultAccountMaster = holdersTarget?.jettonMaster || undefined;
    const defaultAssetJetton = useJetton({ owner: address, master: defaultAccountMaster });

    const initialAsset: ReceiveableAsset | null = useMemo(() => {
        if (initAsset) {
            return initAsset;
        }
        if (!!defaultAccount && !!defaultAccount.address) {
            const name = getAccountName(defaultAccount.accountIndex, defaultAccount.name);
            return {
                address: Address.parse(defaultAccount.address),
                content: {
                    icon: defaultAssetJetton?.icon,
                    name: name
                },
                holders: defaultAccount
            };
        }
        return null;
    }, [defaultAccount, initAsset, holdersTarget, defaultAssetJetton]);

    const [asset, setAsset] = useState<ReceiveableAsset | null>(initialAsset);

    const holdersAssetTarget = !!asset?.holders?.address ? mapHoldersAccountTarget(asset?.holders) : undefined;
    const holdersCards = asset?.holders?.cards || [];
    const assetMaster = holdersAssetTarget
        ? holdersAssetTarget.jettonMaster
        : asset?.address?.toString({ testOnly: network.isTestnet });
    const jetton = useJettonContent(assetMaster);
    const jettonAssetcontent: ReceiveableAssetContent | null = jetton ? {
        icon: jetton.originalImage,
        name: jetton.name
    } : null
    const icon = jettonAssetcontent?.icon;
    const name = asset?.content?.name;

    const { isSCAM, verified: isVerified } = useVerifyJetton({
        ticker: name,
        master: asset?.address?.toString({ testOnly: network.isTestnet })
    });

    const navigateToAssets = useCallback(() => {
        navigation.navigateAssets(
            {
                assetCallback: setAsset,
                selectedAsset: asset?.address,
                viewType: AssetViewType.Receive,
                includeHolders: true
            },
            ledger
        );
    }, [ledger, asset, setAsset, navigation]);

    const friendly = useMemo(() => {
        if (asset?.holders) {
            return asset.address.toString({ testOnly: network.isTestnet });
        }

        if (addr) {
            try {
                const parsed = Address.parseFriendly(addr);
                return parsed.address.toString({ testOnly: network.isTestnet, bounceable: parsed.isBounceable });
            } catch {
                Alert.alert(t('common.error'), t('transfer.error.invalidAddress'));
            }
        }
        return selected!.address.toString({ testOnly: network.isTestnet, bounceable: bounceableFormat });
    }, [asset?.holders, asset?.address, selected?.addressString, bounceableFormat]);

    const assetFriendly = asset?.address?.toString({ testOnly: network.isTestnet });
    const holdersJetton = holdersAssetTarget?.jettonMaster;
    const comment = (!!asset?.holders && !holdersJetton) ? 'Top Up' : undefined;
    const isHolders = !!asset?.holders;

    const link = useMemo(() => {
        const base = `https://${network.isTestnet ? 'test.' : ''}tonhub.com/transfer/`;

        if (asset?.holders) {

            const query = !holdersJetton
                ? `?text=${encodeURIComponent(comment ?? '')}`
                : `?jetton=${holdersJetton}`;

            return base + friendly + query;
        }

        if (asset) {
            return base + friendly + `?jetton=${assetFriendly}`
        }

        return base + friendly;
    }, [friendly, holdersJetton, comment, assetFriendly]);

    let verifIcon = null;

    if (isVerified) {
        verifIcon = (
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 20, width: 20, borderRadius: 10,
                position: 'absolute', right: -2, bottom: -2,
                backgroundColor: theme.surfaceOnElevation
            }}>
                <Image
                    source={require('@assets/ic-verified.png')}
                    style={{ height: 20, width: 20 }}
                />
            </View>
        );
    }

    if (isSCAM) {
        verifIcon = (
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 20, width: 20, borderRadius: 10,
                position: 'absolute', right: -2, bottom: -2,
                backgroundColor: theme.surfaceOnBg
            }}>
                <Image
                    source={require('@assets/ic-jetton-scam.png')}
                    style={{ height: 20, width: 20 }}
                />
            </View>
        );
    }

    const onCopyAddress = useCallback(() => {
        copyText(friendly);

        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT
            }
        );
    }, [friendly, toaster]);

    const onCopyComment = useCallback(() => {
        if (!comment) {
            return;
        }
        copyText(comment);

        toaster.show(
            {
                message: t('common.comment') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
            }
        );
    }, [comment, toaster]);

    const onScreenCapture = async () => {
        const localUri = await captureRef(imageRef, {
            height: 440,
            quality: 1,
        });
        return { uri: localUri };
    }

    const onShare = useCallback(async () => {
        let screenShot: { uri: string } | undefined;

        if (onScreenCapture) {
            try {
                screenShot = await onScreenCapture();
            } catch { }
        }

        try {
            await Share.open({
                title: t('receive.share.title'),
                message: link,
                url: screenShot?.uri,
            });
        } catch (e) {
            // Failed to capture screen [Error: User did not share]
            if ((e as Error)?.message === 'User did not share') {
                return;
            }

            toaster.show({
                type: 'error',
                message: t('receive.share.error')
            });
        }
    }, [link]);

    const screenWidth = dimensions.width;
    let qrCodeSize = qrSize

    if (!!comment) {
        qrCodeSize -= 32;
    }

    if (screenWidth < 360) {
        qrCodeSize = qrCodeSize * 0.8;
    }

    return (
        <View
            style={{
                flexGrow: 1,
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
            collapsable={false}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
                title={isHolders ? t('wallet.actions.deposit') : t('receive.title')}
                onClosePressed={navigation.goBack}
            />
            <ScrollView style={{ flexGrow: 1, width: '100%' }}>
                <View
                    ref={imageRef}
                    style={[Platform.select({
                        ios: { backgroundColor: theme.elevation },
                        android: { backgroundColor: theme.backgroundPrimary }
                    }), {
                        alignItems: 'center',
                        gap: 16
                    }]}
                >
                    {isHolders ? (
                        <Animated.View
                            entering={FadeInUp}
                            exiting={FadeOutDown}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                borderRadius: 20,
                                gap: 16,
                                overflow: 'hidden', padding: 16,
                                justifyContent: 'center', marginHorizontal: 16
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: theme.warning,
                                    opacity: 0.16,
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0
                                }}
                            />
                            <Image
                                style={{ height: 16, width: 16 }}
                                source={require('@assets/ic-warning.png')}
                            />
                            <Text style={[
                                { color: theme.warning, flexShrink: 1 },
                                Typography.regular15_20
                            ]}>
                                {t('receive.holdersJettonWarning', { symbol: (!!holdersJetton && jetton?.symbol) ? jetton?.symbol : 'TON' })}
                            </Text>
                        </Animated.View>
                    ) : (
                        <Text style={[{
                            color: theme.textSecondary,
                            textAlign: 'center',
                        }, Typography.regular17_24]}>
                            {t('receive.subtitle')}
                        </Text>
                    )}
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: theme.style === 'dark' ? theme.white : theme.surfaceOnElevation,
                        borderRadius: 20,
                        height: qrCodeSize + 32,
                        width: qrCodeSize + 32,
                        overflow: 'hidden',
                    }}>
                        <View style={{
                            height: qrCodeSize,
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            <QRCode
                                data={link}
                                size={qrCodeSize}
                                icon={icon}
                                color={theme.backgroundUnchangeable}
                            />
                        </View>
                    </View>
                    <Animated.View
                        entering={FadeInUp}
                        exiting={FadeOutDown}
                        style={{ marginHorizontal: 32 }}
                    >
                        <Pressable
                            hitSlop={10}
                            onPress={onCopyAddress}
                            style={({ pressed }) => ({
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
                                opacity: pressed ? 0.8 : 1
                            })}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <View style={{ flexShrink: 1 }}>
                                    <Text style={[
                                        { color: theme.textSecondary },
                                        Typography.regular15_20
                                    ]}>
                                        {t('common.address')}
                                    </Text>
                                    <Text style={[
                                        { color: theme.textPrimary, flexShrink: 1 },
                                        Typography.regular17_24
                                    ]}>
                                        {friendly}
                                    </Text>
                                </View>
                                <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                            </View>
                        </Pressable>
                    </Animated.View>
                    {!!comment && (
                        <Animated.View
                            entering={FadeInUp}
                            exiting={FadeOutDown}
                            style={{ marginHorizontal: 32 }}
                        >
                            <Pressable
                                hitSlop={10}
                                onPress={onCopyComment}
                                style={({ pressed }) => ({
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
                                    opacity: pressed ? 0.8 : 1,
                                    borderWidth: 1,
                                    borderColor: theme.warning
                                })}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                    <View style={{ flexShrink: 1 }}>
                                        <Text style={[
                                            { color: theme.textSecondary },
                                            Typography.regular15_20
                                        ]}>
                                            {t('transfer.error.holdersMemoRequired')}
                                        </Text>
                                        <Text style={[
                                            { color: theme.textPrimary, flexShrink: 1 },
                                            Typography.regular17_24
                                        ]}>
                                            {friendly}
                                        </Text>
                                    </View>
                                    <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                                </View>
                            </Pressable>
                        </Animated.View>
                    )}
                </View>
                <Animated.View
                    style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 40, paddingHorizontal: 16, gap: 8,
                        flexShrink: 1, maxWidth: 224, marginTop: 16, alignSelf: 'center',
                        paddingVertical: 8
                    }}
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                >
                    <Pressable
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                        onPress={onShare}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}>
                            <View style={{ height: 20, width: 20, justifyContent: 'center', alignItems: 'center' }}>
                                <Image
                                    source={require('@assets/ic-share.png')}
                                    style={{ height: 20, width: 20 }}
                                />
                            </View>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {t('common.share')}
                            </Text>
                        </View>
                    </Pressable>
                </Animated.View>
                {!!asset?.holders && (
                    <Animated.View
                        style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 40, paddingHorizontal: 16,
                            flexShrink: 1, maxWidth: 224, marginTop: 16, alignSelf: 'center',
                            paddingVertical: 8
                        }}
                        entering={FadeInUp}
                        exiting={FadeOutDown}
                    >
                        <Pressable
                            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            onPress={() => navigation.navigateExchanges({ holdersAccount: asset.holders! })}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}>
                                <View style={{ height: 20, width: 20, justifyContent: 'center', alignItems: 'center' }}>
                                    <Image
                                        source={require('@assets/ic-from-exchange.png')}
                                        style={{ height: 20, width: 20 }}
                                    />
                                </View>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {t('receive.fromExchange')}
                                </Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
});