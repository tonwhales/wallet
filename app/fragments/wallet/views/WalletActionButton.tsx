import { memo } from "react";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { ThemeType } from "../../../engine/state/theme";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { Address } from "@ton/core";
import { AssetViewType } from "../AssetsFragment";

export enum WalletActionType {
    Send = 'send',
    Receive = 'receive',
    Deposit = 'deposit',
    Buy = 'buy',
    Swap = 'swap',
};

export type WalletAction = {
    type: WalletActionType.Buy
} | {
    type: WalletActionType.Send,
    jetton?: Address
} | {
    type: WalletActionType.Receive,
    jetton?: {
        master: Address,
        data?: JettonMasterState
    }
} | {
    type: WalletActionType.Deposit,
    jetton?: {
        master: Address,
        data?: JettonMasterState
    }
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
    theme
}: {
    action: WalletAction,
    navigation: TypedNavigation,
    theme: ThemeType,
}) => {

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
            return (
                <Pressable
                    onPress={() => navigation.navigateSimpleTransfer({ ...nullTransfer, jetton: action.jetton })}
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
                        <Text
                            style={{
                                fontSize: 15,
                                color: theme.textPrimary,
                                marginTop: 6,
                                fontWeight: '500',
                            }}
                        >
                            {t('wallet.actions.send')}
                        </Text>
                    </View>
                </Pressable>
            );
        }
        case WalletActionType.Receive: {
            const navigate = () => {
                if (action.jetton) {
                    navigation.navigateReceive({
                        asset: {
                            address: action.jetton.master,
                            content: action.jetton.data ? {
                                icon: action.jetton.data?.originalImage ?? action.jetton.data?.image?.preview256,
                                name: action.jetton.data?.symbol
                            } : undefined
                        }
                    });

                    return;
                }

                navigation.navigateReceiveAssets({ title: t('wallet.actions.receive') });
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
                            style={{
                                fontSize: 15, lineHeight: 20,
                                color: theme.textPrimary,
                                marginTop: 6,
                                fontWeight: '500'
                            }}
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
                if (action.jetton) {
                    navigation.navigateReceive({
                        asset: {
                            address: action.jetton.master,
                            content: action.jetton.data ? {
                                icon: action.jetton.data?.originalImage ?? action.jetton.data?.image?.preview256,
                                name: action.jetton.data?.symbol
                            } : undefined
                        }
                    });

                    return;
                }

                navigation.navigateReceiveAssets({ title: t('wallet.actions.deposit') });
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
                            style={{
                                fontSize: 15, lineHeight: 20,
                                color: theme.textPrimary,
                                marginTop: 6,
                                fontWeight: '500'
                            }}
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
                        <Text
                            style={{
                                fontSize: 15,
                                color: theme.textPrimary,
                                marginTop: 6,
                                fontWeight: '500',
                            }}
                        >
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