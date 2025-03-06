import { memo } from "react";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { ThemeType } from "../../../engine/state/theme";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { useNetwork } from "../../../engine/hooks";

export enum WalletActionType {
    Send = 'send',
    Receive = 'receive',
    Deposit = 'deposit',
    Buy = 'buy',
    Swap = 'swap',
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
    jetton?: Address
} | {
    type: WalletActionType.Receive,
    asset?: ReceiveAsset
} | {
    type: WalletActionType.Deposit,
    asset?: ReceiveAsset
} | {
    type: WalletActionType.Swap
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
    isLedger,
    solana
}: {
    action: WalletAction,
    navigation: TypedNavigation,
    theme: ThemeType,
    isLedger?: boolean,
    solana?: boolean
}) => {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();

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
                if (solana) {
                    navigation.navigateSolanaSimpleTransfer({});
                    return;
                }
                navigation.navigateSimpleTransfer(
                    { ...nullTransfer, jetton: action.jetton },
                    { ledger: isLedger }
                );
            }

            if (isLedger && !(ledgerContext.tonTransport && !ledgerContext.isReconnectLedger)) {
                navigate = ledgerContext.onShowLedgerConnectionError;
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
        case WalletActionType.Receive: {
            const navigate = () => {
                if (solana) {
                    navigation.navigateSolanaReceive();
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