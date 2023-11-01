import React, {  } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from 'expo-blur';
import { t } from "../../i18n/t";
import { RoundButton } from "../../components/RoundButton";
import LottieView from "lottie-react-native";
import { useTheme } from '../../engine/hooks/useTheme';
import { SelectedAccount, useSelectedAccount } from '../../engine/hooks/useSelectedAccount';
import { useAccountTransactions } from '../../engine/hooks/useAccountTransactions';
import { useClient4 } from '../../engine/hooks/useClient4';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { WalletTransactions } from "./views/WalletTransactions";

function TransactionsComponent(props: { account: SelectedAccount }) {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const client = useClient4(useNetwork().isTestnet);
    const txs = useAccountTransactions(client, props.account.addressString);
    const transactions = txs?.data;
    const address = props.account.address;

    const onReachedEnd = React.useCallback(() => {
        if (txs?.hasNext) {
            txs?.next();
        }
    }, [txs?.next, txs?.hasNext]);

    if (!transactions) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            {transactions.length === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                    <Pressable
                        onPress={() => {
                            animRef.current?.play();
                        }}>
                        <LottieView
                            ref={animRef}
                            source={require('../../../assets/animations/duck.json')}
                            autoPlay={true}
                            loop={false}
                            progress={0.2}
                            style={{ width: 192, height: 192 }}
                        />
                    </Pressable>
                    <Text style={{ fontSize: 16, color: theme.label }}>
                        {t('wallet.empty.message')}
                    </Text>
                    <RoundButton
                        title={t('wallet.empty.receive')}
                        size="normal"
                        display="text"
                        onPress={() => navigation.navigate('Receive')}
                    />
                </View>
            )}
            {transactions.length > 0 && (
                <WalletTransactions
                    txs={transactions}
                    address={address}
                    navigation={navigation}
                    safeArea={safeArea}
                    onLoadMore={onReachedEnd}
                    hasNext={txs.hasNext}
                    frameArea={frameArea}
                    loading={txs.loading}
                />
            )}
            {/* iOS Toolbar */}
            {
                Platform.OS === 'ios' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                    }}>
                        <View style={{ backgroundColor: theme.background, opacity: 0.9, flexGrow: 1 }} />
                        <BlurView style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            paddingTop: safeArea.top,
                            flexDirection: 'row',
                            overflow: 'hidden'
                        }}
                        >
                            <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[
                                    {
                                        fontSize: 22,
                                        color: theme.textColor,
                                        fontWeight: '700',
                                        position: 'relative'
                                    }
                                ]}>
                                    {t('transactions.history')}
                                </Text>
                            </View>
                        </BlurView>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: theme.headerDivider,
                            opacity: 0.08
                        }} />
                    </View >
                )
            }
            {/* Android Toolbar */}
            {
                Platform.OS === 'android' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                        backgroundColor: theme.background,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Text style={[
                                {
                                    fontSize: 22,
                                    color: theme.textColor,
                                    fontWeight: '700',
                                    position: 'relative'
                                },
                            ]}>
                                {t('transactions.history')}
                            </Text>
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: theme.headerDivider,
                            opacity: 0.08
                        }} />
                    </View>
                )
            }
        </View >
    );
}

export const TransactionsFragment = fragment(() => {
    const account = useSelectedAccount();

    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return (
            <TransactionsComponent account={account} />
        )
    }
}, true);