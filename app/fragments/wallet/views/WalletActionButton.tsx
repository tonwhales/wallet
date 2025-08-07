import { memo, useCallback } from "react";
import { Pressable, View, Image, Text, StyleSheet, Platform } from "react-native";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { ThemeType } from "../../../engine/state/theme";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { ReceiveableSolanaAsset } from "../ReceiveFragment";
import { useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount, useSolanaSelectedAccount } from "../../../engine/hooks";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { HoldersAppParams, HoldersAppParamsType } from "../../holders/HoldersAppFragment";
import { SimpleTransferAsset } from "../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { AppsFlyerEvent, RegistrationMethod, trackAppsFlyerEvent } from "../../../analytics/appsflyer";
import { useQRCodeHandler } from "../../../engine/hooks/qrcode/useQRCodeHandler";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { holdersUrl, HoldersUserState } from "../../../engine/api/holders/fetchUserState";

export enum WalletActionType {
    Send = 'send',
    SendSolana = 'sendSolana',
    Receive = 'receive',
    Deposit = 'deposit',
    Buy = 'buy',
    Swap = 'swap',
    Scan = 'scan',
};

export type ReceiveAsset = {
    type: 'jetton',
    jetton?: {
        master: Address,
        data?: JettonMasterState
    }
} | {
    type: 'ton'
} | {
    type: 'solana',
    addr: string,
    asset?: ReceiveableSolanaAsset;
}

export type WalletAction = {
    type: WalletActionType.Buy
} | {
    type: WalletActionType.Send,
    jettonWallet?: Address
} | {
    type: WalletActionType.Receive,
    asset?: ReceiveAsset
} | {
    type: WalletActionType.Deposit,
    asset?: ReceiveAsset
} | {
    type: WalletActionType.Swap
} | {
    type: WalletActionType.SendSolana,
    token?: string
} | {
    type: WalletActionType.Scan
}

const nullTransfer = {
    amount: null,
    target: null,
    stateInit: null,
    job: null,
    comment: null,
    jetton: null,
    callback: null
};

export const WalletActionButton = memo(({
    action,
    navigation,
    theme,
    isLedger
}: {
    action: WalletAction,
    navigation: TypedNavigation,
    theme: ThemeType,
    isLedger?: boolean
}) => {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();
    const solanaAddress = useSolanaSelectedAccount();
    const [isWalletMode] = useAppMode(selected?.address, { isLedger });
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected?.address!;
    const accounts = useHoldersAccounts(address, solanaAddress).data?.accounts;
    const bottomBarHeight = useBottomTabBarHeight();
    const handleQRCode = useQRCodeHandler({ toastProps: { marginBottom: Platform.select({ ios: 16 + bottomBarHeight, android: 16 }) } });
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: handleQRCode }), [handleQRCode]);
    const isDisabled = !isWalletMode && !accounts?.length;
    const onSwap = useCallback(() => {
        // TODO: rm platfrom check after review
        // dont show Dedust on ios until the issue with review is resolved
        if (Platform.OS === 'android' && !isLedger) {
            navigation.navigate('SelectExchange');
        } else {
            navigation.navigateSwap();
        }
    }, [navigation]);

    switch (action.type) {
        case WalletActionType.Buy: {
            return (
                <Pressable
                    onPress={() => navigation.navigate('Buy')}
                    style={({ pressed }) => ([{ opacity: pressed ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic-buy.png')} />
                        </View>
                        <Text
                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {t('wallet.actions.buy')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Send: {
            let navigate = () => {
                trackAppsFlyerEvent(AppsFlyerEvent.CompletedRegistration, { method: RegistrationMethod.Create })
                if (isWalletMode) {
                    const asset: SimpleTransferAsset | null = action.jettonWallet ? { type: 'jetton', wallet: action.jettonWallet } : null;
                    navigation.navigateSimpleTransfer(
                        { ...nullTransfer, asset },
                        { ledger: isLedger }
                    );
                } else {
                    const accountId = accounts?.[0]?.id;
                    if (accountId) {
                        const path = `/transfer/${accounts}`;
                        const navParams: HoldersAppParams = { type: HoldersAppParamsType.Path, path, query: {} };
                        if (needsEnrollment || !isHoldersReady) {
                            navigation.navigateHoldersLanding(
                                { endpoint: url, onEnrollType: navParams },
                                isTestnet
                            );
                            return;
                        }
                
                        navigation.navigateHolders(navParams, isTestnet);
                    }
                }
            }

            return (
                <Pressable
                    onPress={navigate}
                    disabled={isDisabled}
                    style={({ pressed }) => ([{ opacity: pressed || isDisabled ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_send.png')} />
                        </View>
                        <Text
                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {isWalletMode ? t('wallet.actions.send') : t('wallet.actions.payments')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Receive: {
            const navigate = () => {
                if (action.asset?.type === 'solana') {
                    navigation.navigateSolanaReceive({
                        addr: action.asset.addr,
                        asset: action.asset.asset
                    });
                    return;
                }

                if (!!action.asset) {
                    const address = isLedger ? ledgerContext.addr?.address : undefined;
                    let addr = undefined;
                    if (address) {
                        addr = Address.parse(address).toString({ bounceable: isLedger ? false : undefined, testOnly: isTestnet });
                    }
                    const asset = action.asset.type === 'jetton' && !!action.asset.jetton ? {
                        address: action.asset.jetton.master,
                        content: action.asset.jetton.data ? {
                            icon: action.asset.jetton.data?.originalImage ?? action.asset.jetton.data?.image?.preview256,
                            name: action.asset.jetton.data?.symbol
                        } : undefined
                    } : undefined;
                    navigation.navigateReceive({ asset, addr }, isLedger);

                    return;
                }

                navigation.navigateReceiveAssets({ title: t('wallet.actions.receive') }, isLedger);
            }

            return (
                <Pressable
                    onPress={navigate}
                    disabled={isDisabled}
                    style={({ pressed }) => ([{ opacity: pressed || isDisabled ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_receive.png')} />
                        </View>
                        <Text
                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {t('wallet.actions.receive')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Deposit: {
            const navigate = () => {
                if (!!action.asset) {
                    const asset = action.asset.type === 'jetton' && !!action.asset.jetton ? {
                        address: action.asset.jetton.master,
                        content: action.asset.jetton.data ? {
                            icon: action.asset.jetton.data?.originalImage ?? action.asset.jetton.data?.image?.preview256,
                            name: action.asset.jetton.data?.symbol
                        } : undefined
                    } : undefined;
                    navigation.navigateReceive({ asset }, isLedger);

                    return;
                }

                navigation.navigateReceiveAssets({ title: t('wallet.actions.deposit') }, isLedger);
            }

            return (
                <Pressable
                    onPress={navigate}
                    style={({ pressed }) => ([{ opacity: pressed ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_receive.png')} />
                        </View>
                        <Text
                            style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {t('wallet.actions.deposit')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Swap: {
            return (
                <Pressable
                    onPress={onSwap}
                    style={({ pressed }) => ([{ opacity: pressed ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_swap.png')} />
                        </View>
                        <Text
                            style={[
                                { color: theme.textPrimary, marginTop: 6 },
                                Typography.medium15_20
                            ]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {t('wallet.actions.swap')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.SendSolana: {
            const navigate = () => {
                navigation.navigateSolanaSimpleTransfer({ token: action.token });
            }

            return (
                <Pressable
                    onPress={navigate}
                    style={({ pressed }) => ([{ opacity: pressed ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic_send.png')} />
                        </View>
                        <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}>
                            {t('wallet.actions.send')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Scan: {
            return (
                <Pressable
                    onPress={openScanner}
                    style={({ pressed }) => ([{ opacity: pressed ? 0.5 : 1 }, styles.button])}
                >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            backgroundColor: theme.accent,
                            width: 32, height: 32,
                            borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Image source={require('@assets/ic-scan-main.png')} />
                        </View>
                        <Text
                            style={[
                                { color: theme.textPrimary, marginTop: 6 },
                                Typography.medium15_20
                            ]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
                            ellipsizeMode={"tail"}
                            numberOfLines={1}
                        >
                            {t('wallet.actions.scan')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        default: {
            return null;
        }
    }
});

const styles = StyleSheet.create({
    button: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
});