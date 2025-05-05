import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { View, Text, Pressable, ScrollView, Platform, Alert, useWindowDimensions } from "react-native";
import { t } from "../../i18n/t";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { captureRef } from 'react-native-view-shot';
import { useNetwork, useBounceableWalletFormat, useSelectedAccount, useTheme, useJetton, useIsLedgerRoute, useIsSolanaRoute } from "../../engine/hooks";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { mapHoldersAccountTarget } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { copyText } from "../../utils/copyText";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import Share from 'react-native-share';
import { ExchangesFragmentParams } from "./ExchangesFragment";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { TransportStatusError } from "@ledgerhq/hw-transport";
import { encodeURL } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import CopyIcon from '@assets/ic-copy.svg';

type ReceiveableAssetContent = {
    icon: string | null | undefined;
    name: string | null | undefined;
}

export type ReceiveableTonAsset = {
    address: Address,
    content?: ReceiveableAssetContent,
    holders?: GeneralHoldersAccount
}

export type ReceiveableSolanaAsset = {
    mint: string,
    content?: ReceiveableAssetContent,
}

export type ReceiveTonParams = {
    type: 'ton',
    addr?: string;
    asset?: ReceiveableTonAsset;
}

export type ReceiveSolanaParams = {
    type: 'solana',
    addr: string,
    asset?: ReceiveableSolanaAsset;
}

export type ReceiveFragmentParams = ReceiveTonParams | ReceiveSolanaParams;

const qrSize = 262;

export const ReceiveFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const imageRef = useRef<View>(null);
    const { addr, asset, type } = useParams<ReceiveFragmentParams>();
    const selected = useSelectedAccount();
    const [bounceableFormat] = useBounceableWalletFormat();
    const toaster = useToaster();
    const dimensions = useWindowDimensions();
    const isSolana = useIsSolanaRoute();
    const isLedger = useIsLedgerRoute();
    const ledgerContext = useLedgerTransport();

    const isTon = type === 'ton';
    const tonAsset = isTon ? asset as ReceiveableTonAsset : undefined;
    const solanaAsset = isTon ? undefined : asset as ReceiveableSolanaAsset;

    const tonAddress = useMemo(() => {
        if (!isTon) {
            return undefined;
        }

        if (addr) {
            try {
                const parsed = Address.parseFriendly(addr);
                return parsed.address;
            } catch {
                Alert.alert(t('common.error'), t('transfer.error.invalidAddress'));
            }
        }
        return selected!.address;
    }, [selected, addr, isTon]);

    const holdersAssetTarget = tonAsset?.holders?.address
        ? mapHoldersAccountTarget(tonAsset.holders)
        : undefined;
    const assetMaster = isTon
        ? (holdersAssetTarget?.jettonMaster || tonAsset?.address?.toString({ testOnly: network.isTestnet }))
        : undefined;
    const jetton = useJetton({ owner: tonAddress, master: assetMaster });
    const jettonAssetcontent: ReceiveableAssetContent | null = jetton ? {
        icon: jetton.icon,
        name: jetton.name
    } : null
    const icon = isTon
        ? (tonAsset?.content?.icon || jettonAssetcontent?.icon)
        : solanaAsset?.content?.icon;
    const name = asset?.content?.name;

    const friendly = useMemo(() => {
        if (!isTon) {
            return addr;
        }

        if (tonAsset?.holders) {
            return tonAsset.address.toString({ testOnly: network.isTestnet });
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
    }, [asset, selected?.addressString, bounceableFormat, isTon]);

    const assetFriendly = tonAsset?.address?.toString({ testOnly: network.isTestnet });
    const holdersJetton = holdersAssetTarget?.jettonMaster;
    const comment = (!!tonAsset?.holders && !holdersJetton) ? 'Top Up' : undefined;
    const isHolders = tonAsset?.holders;

    const link = useMemo(() => {
        if (!isTon) {
            return encodeURL({ recipient: new PublicKey(addr!), memo: comment }).toString();
        }

        const base = `https://${network.isTestnet ? 'test.' : ''}tonhub.com/transfer/`;

        if (tonAsset?.holders) {
            const query = !holdersJetton
                ? `?text=${encodeURIComponent(comment ?? '')}`
                : `?jetton=${holdersJetton}`;

            return base + friendly + query;
        }

        if (tonAsset) {
            return base + friendly + `?jetton=${assetFriendly}`
        }

        return base + friendly;
    }, [friendly, holdersJetton, comment, assetFriendly, isTon, tonAsset]);

    const onCopyAddress = useCallback(() => {
        copyText(friendly!);

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

    const [capturing, setCapturing] = useState(false);

    const onScreenCapture = async () => {
        setCapturing(true);
        // wait for the view to render
        await new Promise((resolve) => setTimeout(resolve, 50));
        const localUri = await captureRef(imageRef, {
            height: 440,
            quality: 1,
        });
        setCapturing(false);
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

    const verifyLedger = async () => {
        if (!isTon) {
            return;
        }

        if (!isLedger) {
            return
        }
        if (!(ledgerContext.tonTransport && !ledgerContext.isReconnectLedger)) {
            ledgerContext.onShowLedgerConnectionError();
            return;
        }

        try {
            const verificationResult = await ledgerContext.verifySelectedAddress(network.isTestnet)
            const isValid = !!verificationResult && Address.parse(verificationResult.address).equals(tonAddress!);

            if (!isValid) {
                Alert.alert(t('hardwareWallet.verifyAddress.invalidAddressTitle'), t('hardwareWallet.verifyAddress.invalidAddressMessage'));
                return;
            }

        } catch (e) {
            const isCanceled = e instanceof TransportStatusError && (e as any).statusCode === 0x6985;
            if (isCanceled) {
                return;
            }
            Alert.alert(
                t('hardwareWallet.verifyAddress.failed'),
                t('hardwareWallet.verifyAddress.failedMessage')
            );
        }
    };

    const screenWidth = dimensions.width;
    let qrCodeSize = qrSize

    if (!!comment) {
        qrCodeSize -= 32;
    }

    if (screenWidth < 360) {
        qrCodeSize = qrCodeSize * 0.8;
    }

    const title = `${isHolders ? t('receive.deposit') : t('receive.title')} ${name ?? (isSolana ? 'SOL' : 'TON')}`;

    const navigateToExchanges = () => {
        let params: ExchangesFragmentParams | undefined;
        if (!isTon) {
            params = {
                type: 'solana-wallet',
                address: addr,
                ticker: solanaAsset?.content?.name ?? 'SOL',
            };
        } else {
            params = tonAsset?.holders
                ? { type: 'holders', holdersAccount: tonAsset.holders }
                : {
                    type: 'wallet',
                    address: friendly!,
                    ticker: jetton?.symbol ?? 'TON',
                    tokenContract: jetton?.master?.toString({ testOnly: network.isTestnet }),
                };
        }

        navigation.navigateExchanges(params);
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
                style={[Platform.select({ android: { paddingTop: safeArea.top } }), { paddingLeft: 16 }]}
                title={title}
                onBackPressed={navigation.goBack}
                onClosePressed={navigation.popToTop}
            />
            <ScrollView style={{ flexGrow: 1, width: '100%' }}>
                <View
                    ref={imageRef}
                    style={[Platform.select({
                        ios: { backgroundColor: theme.elevation },
                        android: { backgroundColor: theme.backgroundPrimary }
                    }), {
                        alignItems: 'center',
                        gap: 16,
                        paddingVertical: capturing ? 16 : 0,
                        marginTop: capturing ? -16 : 0
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
                            textAlign: 'center', marginHorizontal: 16
                        }, Typography.regular17_24]}>
                            {isTon ? t('receive.subtitleTon') : t('receive.subtitleSolana')}
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
                                type={isTon ? 'ton' : 'solana'}
                                data={link}
                                size={qrCodeSize}
                                icon={icon}
                                color={theme.backgroundUnchangeable}
                            />
                        </View>
                    </View>
                    <View style={{ gap: 16 }}>
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
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
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
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
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
                                                {comment}
                                            </Text>
                                        </View>
                                        <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                                    </View>
                                </Pressable>
                            </Animated.View>
                        )}
                    </View>
                </View>
                {isLedger && (
                    <Animated.View
                        style={{
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 40, paddingHorizontal: 16,
                            flexShrink: 1, maxWidth: 224, alignSelf: 'center',
                            paddingVertical: 8,
                            marginTop: capturing ? 0 : 16
                        }}
                        entering={FadeInUp}
                        exiting={FadeOutDown}
                    >
                        <Pressable
                            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            onPress={verifyLedger}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}>
                                <View style={{ height: 20, width: 20, justifyContent: 'center', alignItems: 'center' }}>
                                    <Image
                                        source={require('@assets/ic-backup.png')}
                                        style={{ height: 20, width: 20 }}
                                    />
                                </View>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {t('hardwareWallet.verifyAddress.action')}
                                </Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                )}
                <Animated.View
                    style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 40, paddingHorizontal: 16, gap: 8,
                        flexShrink: 1, maxWidth: 224,
                        marginTop: (capturing && !isLedger) ? 0 : 16,
                        alignSelf: 'center',
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
                        onPress={navigateToExchanges}
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
            </ScrollView>
        </View>
    );
});