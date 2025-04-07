import { memo, useCallback } from "react";
import { Pressable, View, Image, Text, StyleSheet, Platform } from "react-native";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { ThemeType } from "../../../engine/state/theme";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { useHoldersAccounts, useNetwork, useSelectedAccount } from "../../../engine/hooks";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { HoldersAppParams, HoldersAppParamsType } from "../../holders/HoldersAppFragment";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SimpleTransferAsset } from "../../secure/simpleTransfer/hooks/useSimpleTransfer";

export enum WalletActionType {
    Send = 'send',
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
    const [isWalletMode] = useAppMode(selected?.address, { isLedger });
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected?.address!;
    const accounts = useHoldersAccounts(address).data?.accounts;
    const bottomBarHeight = useBottomTabBarHeight();
    const linkNavigator = useLinkNavigator(isTestnet, { marginBottom: Platform.select({ ios: 16 + bottomBarHeight, android: 16 }) });

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    }, [isTestnet, linkNavigator]);

    const onLedgerQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, isTestnet);

            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                const bounceable = res.isBounceable ?? true;
                if (res.type === 'transaction') {
                    if (res.payload) {
                        // TODO: implement
                        // navigation.navigateLedgerSignTransfer({
                        //     order: {
                        //         target: res.address.toString({ testOnly: network.isTestnet }),
                        //         amount: res.amount || 0n,
                        //         amountAll: false,
                        //         stateInit: res.stateInit,
                        //         payload: {
                        //             type: 'unsafe',
                        //             message: new CellMessage(res.payload),
                        //         },
                        //     },
                        //     text: res.comment
                        // });
                    } else {
                        navigation.navigateSimpleTransfer({
                            target: res.address.toString({ testOnly: isTestnet, bounceable }),
                            comment: res.comment,
                            amount: res.amount,
                            stateInit: res.stateInit,
                            asset: null,
                            callback: null,
                            unknownDecimals: true,
                        }, { ledger: true });
                    }
                    return;
                }

                navigation.navigateSimpleTransfer({
                    target: res.address.toString({ testOnly: isTestnet, bounceable }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    asset: { type: 'jetton', master: res.jettonMaster },
                    callback: null,
                    unknownDecimals: true,
                }, { ledger: true });
            }
        } catch {
            // Ignore
        }
    }, [isTestnet, linkNavigator]);

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: isLedger ? onLedgerQRCodeRead : onQRCodeRead }), [isLedger, onLedgerQRCodeRead, onQRCodeRead]);

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
                        <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}
                            minimumFontScale={0.7}
                            adjustsFontSizeToFit
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
                        navigation.navigateHolders(navParams, isTestnet);
                    }
                }
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
                            {isWalletMode ? t('wallet.actions.send') : t('wallet.actions.payments')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Receive: {
            const navigate = () => {
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
                    onPress={() => navigation.navigate('Swap')}
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
                        <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}>
                            {t('wallet.actions.swap')}
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
                            <Image
                                source={require('@assets/ic-scan-main.png')}

                            />
                        </View>
                        <Text style={[{ color: theme.textPrimary, marginTop: 6 }, Typography.medium15_20]}>
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