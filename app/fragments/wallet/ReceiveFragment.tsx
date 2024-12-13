import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { View, Text, Pressable, ScrollView, Platform, Alert } from "react-native";
import { t } from "../../i18n/t";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { WImage } from "../../components/WImage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { captureRef } from 'react-native-view-shot';
import { useNetwork, useBounceableWalletFormat, useSelectedAccount, useTheme, useVerifyJetton, useJetton, useHoldersAccounts } from "../../engine/hooks";
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
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import Share from 'react-native-share';
import { ItemDivider } from "../../components/ItemDivider";
import { AddressComponent } from "../../components/address/AddressComponent";
import { hasDirectDeposit } from "../../utils/holders/hasDirectDeposit";

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
    const assetMaster = holdersAssetTarget
        ? holdersAssetTarget.jettonMaster
        : asset?.address?.toString({ testOnly: network.isTestnet });
    const jetton = useJetton({ owner: address, master: assetMaster ?? undefined });
    const jettonAssetcontent: ReceiveableAssetContent | null = jetton ? {
        icon: jetton.icon,
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

    const qrCodeSize = !!comment ? qrSize - 32 : qrSize;

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
            <ScrollView
                style={{ flexGrow: 1, width: '100%' }}
                contentContainerStyle={{ gap: 8 }}
            >
                <View
                    ref={imageRef}
                    style={Platform.select({
                        ios: { backgroundColor: theme.elevation },
                        android: { backgroundColor: theme.backgroundPrimary }
                    })}
                >
                    {isHolders ? (
                        <Animated.View
                            entering={FadeInUp}
                            exiting={FadeOutDown}
                            style={{
                                flexDirection: 'row', alignItems: 'flex-start',
                                paddingHorizontal: 43,
                                marginBottom: 8
                            }}
                        >
                            <Text style={[
                                { color: theme.warning, flexShrink: 1, textAlign: 'center' },
                                Typography.regular15_20
                            ]}>
                                {t('receive.holdersJettonWarning', { symbol: (!!holdersJetton && jetton?.symbol) ? jetton?.symbol : 'TON' })}
                            </Text>
                        </Animated.View>
                    ) : (
                        <Text style={[{
                            color: theme.textSecondary,
                            textAlign: 'center',
                            marginBottom: 8,
                            marginHorizontal: 32,
                        }, Typography.regular17_24]}>
                            {t('receive.subtitle')}
                        </Text>
                    )}
                    <View style={{
                        paddingHorizontal: 43,
                        width: '100%',
                        gap: 8
                    }}>
                        <View style={{
                            justifyContent: 'center',
                            backgroundColor: theme.style === 'dark' ? theme.white : theme.surfaceOnElevation,
                            borderRadius: 20,
                            padding: 24,
                            overflow: 'hidden',
                        }}>
                            <View style={{ height: qrCodeSize, justifyContent: 'center', alignItems: 'center' }}>
                                <QRCode
                                    data={link}
                                    size={qrCodeSize}
                                    icon={icon}
                                    color={theme.backgroundUnchangeable}
                                />
                            </View>
                        </View>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 20,
                            padding: 20
                        }}>
                            <Pressable
                                style={({ pressed }) => ([
                                    { opacity: pressed ? 0.5 : 1 },
                                    {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: theme.surfaceOnElevation,
                                        gap: 8
                                    }
                                ])}
                                onPress={navigateToAssets}
                            >
                                <View style={{
                                    height: 46, width: 46,
                                    justifyContent: 'center', alignItems: 'center',
                                }}>
                                    {!!icon ? (
                                        <WImage
                                            src={icon}
                                            width={46}
                                            height={46}
                                            borderRadius={23}
                                            lockLoading
                                        />
                                    ) : (
                                        <Image
                                            source={require('@assets/ic-ton-acc.png')}
                                            style={{ height: 46, width: 46 }}
                                        />
                                    )}
                                    {verifIcon}
                                </View>
                                <View style={{ justifyContent: 'space-between', flexShrink: 1 }}>
                                    <Text
                                        style={[
                                            { color: theme.textPrimary, flexShrink: 1 },
                                            Typography.semiBold17_24
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {`${name ?? `TON ${t('common.wallet')}`}`}
                                        {isSCAM && (
                                            <>
                                                {' • '}
                                                <Text style={{ color: theme.accentRed }}>
                                                    {'SCAM'}
                                                </Text>
                                            </>
                                        )}
                                    </Text>
                                    <Text
                                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        selectable={false}
                                        ellipsizeMode={'middle'}
                                    >
                                        <AddressComponent
                                            address={friendly}
                                            start={6}
                                            end={6}
                                            bounceable={bounceableFormat}
                                            known={isHolders}
                                            testOnly={network.isTestnet}
                                        />
                                    </Text>
                                </View>
                                <View style={{ flexGrow: 1 }} />
                                <Image
                                    source={require('@assets/ic-chevron-right.png')}
                                    style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                />
                            </Pressable>
                            <ItemDivider marginHorizontal={0} />
                            <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-evenly' }}>
                                <Pressable
                                    hitSlop={10}
                                    onPress={onCopyAddress}
                                    style={({ pressed }) => ({
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        opacity: pressed ? 0.5 : 1,
                                        backgroundColor: theme.surfaceOnElevation,
                                        borderRadius: 20
                                    })}
                                >
                                    <Text style={[
                                        { color: theme.textPrimary },
                                        Typography.semiBold17_24
                                    ]}>
                                        {t('common.copy')}
                                    </Text>
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 24, width: 24
                                    }}>
                                        <CopyIcon
                                            style={{ height: 12, width: 12 }}
                                            height={12} width={12}
                                            color={theme.iconPrimary}
                                        />
                                    </View>
                                </Pressable>
                                <View style={{ width: 1, backgroundColor: theme.divider }} />
                                <Pressable
                                    hitSlop={10}
                                    onPress={onShare}
                                    style={({ pressed }) => ({
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        opacity: pressed ? 0.5 : 1,
                                        backgroundColor: theme.surfaceOnElevation,
                                        borderRadius: 20,
                                    })}
                                >
                                    <Text style={[
                                        { color: theme.textPrimary },
                                        Typography.semiBold17_24
                                    ]}>
                                        {t('common.share')}
                                    </Text>
                                    <ShareIcon
                                        style={{ height: 24, width: 24 }}
                                        height={24} width={24}
                                        color={theme.iconPrimary}
                                    />
                                </Pressable>
                            </View>
                        </View>
                        {!!comment && (
                            <Animated.View
                                entering={FadeInUp}
                                exiting={FadeOutDown}
                                style={{
                                    backgroundColor: theme.surfaceOnElevation,
                                    borderRadius: 20, padding: 20
                                }}
                            >
                                <View>
                                    <Text style={[
                                        { color: theme.textSecondary },
                                        Typography.regular15_20
                                    ]}>
                                        {t('transfer.error.holdersMemoRequired')}
                                    </Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={[
                                            { color: theme.textPrimary },
                                            Typography.semiBold17_24
                                        ]}>
                                            {comment}
                                        </Text>
                                        <Pressable
                                            hitSlop={10}
                                            onPress={onCopyComment}
                                            style={({ pressed }) => ({
                                                flexDirection: 'row',
                                                alignItems: 'center', justifyContent: 'center',
                                                gap: 4, opacity: pressed ? 0.5 : 1
                                            })}
                                        >
                                            <CopyIcon style={{ height: 12, width: 12 }} height={12} width={12} color={theme.iconPrimary} />
                                        </Pressable>
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </View>
                {!!asset?.holders && (
                    <Animated.View
                        style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 20, padding: 20, gap: 8,
                            marginHorizontal: 43
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
                                justifyContent: 'space-between'
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <View style={{ height: 46, width: 46, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        <FromExchangeIcon
                                            style={{ height: 46, width: 46 }}
                                            height={46}
                                            width={46}
                                        />
                                    </View>
                                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        {t('receive.fromExchange')}
                                    </Text>
                                </View>
                                <Image
                                    source={require('@assets/ic-chevron-right.png')}
                                    style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                />
                            </View>
                        </Pressable>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
});