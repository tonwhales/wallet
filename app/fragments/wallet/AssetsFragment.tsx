import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { JettonState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AnimatedProductButton } from "./products/AnimatedProductButton";
import { JettonProduct } from "./products/JettonProduct";
import TonIcon from '../../../assets/ic_ton_account.svg';
import BN from "bn.js";
import { Address } from "ton";
import { useJettons } from '../../engine/hooks/useJettons';
import { useAccount } from '../../engine/hooks/useAccount';

export const AssetsFragment = fragment(() => {
    const { target, callback } = useParams<{ target: string, callback?: (address?: Address) => void }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const jettons = useJettons();
    const account = useAccount();

    const navigateToJettonTransfer = useCallback((jetton: JettonState) => {
        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            jetton: jetton.wallet,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const onCallback = useCallback((address?: Address) => {
        if (callback) {
            setTimeout(() => {
                navigation.goBack();
                callback(address);
            }, 10);
        }
    }, [callback]);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.accounts')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.accounts')}
                    </Text>
                </View>
            )}
            <ScrollView style={{ flexGrow: 1 }}>
                <View style={{
                    marginTop: 17,
                    borderRadius: 14,
                    flexShrink: 1,
                }}>
                    <AnimatedProductButton
                        entering={FadeInUp}
                        exiting={FadeOutDown}
                        key={'assets-ton'}
                        name={'TON'}
                        subtitle={t('common.balance')}
                        icon={TonIcon}
                        value={account?.balance ?? new BN(0)}
                        onPress={() => {
                            if (callback) {
                                onCallback();
                                return;
                            }
                            navigation.navigateSimpleTransfer({
                                amount: null,
                                target: target,
                                stateInit: null,
                                job: null,
                                comment: null,
                                jetton: null,
                                callback: null
                            });
                        }}
                        extension={true}
                        style={{ marginVertical: 4 }}
                    />
                    {jettons.map((j) => {
                        return (
                            <JettonProduct
                                key={'jt' + j.wallet.toFriendly()}
                                jetton={j}
                                navigation={navigation}
                                onPress={() => {
                                    if (callback) {
                                        onCallback(j.master);
                                        return;
                                    }
                                    navigateToJettonTransfer(j)
                                }}
                            />
                        );
                    })}
                </View>
                <View style={{ height: safeArea.bottom }} />
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});