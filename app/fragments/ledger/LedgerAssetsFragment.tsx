import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { JettonState } from "../../engine/products/WalletProduct";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import TonIcon from '../../../assets/ic_ton_account.svg';
import BN from "bn.js";
import { Address } from "ton";
import { AnimatedProductButton } from "../../components/products/AnimatedProductButton";
import { useTransport } from "./components/TransportContext";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { JettonProductItem } from "../../components/products/JettonProductItem";

export const LedgerAssetsFragment = fragment(() => {
    const { target, callback } = useParams<{ target?: string, callback?: (address?: Address) => void }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { addr } = useTransport();
    const address = useMemo(() => Address.parse(addr!.address), [addr]);
    const jettons = engine.products.ledger.useJettons(address)?.jettons ?? [];
    const account = engine.products.ledger.useAccount();

    const navigateToJettonTransfer = useCallback((jetton: JettonState) => {
        navigation.replace('LedgerTransfer', {
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
            navigation.goBack();
            callback(address);
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
                            navigation.replace('LedgerTransfer', {
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
                            <JettonProductItem
                                key={'jt' + j.wallet.toFriendly()}
                                jetton={j}
                                engine={engine}
                                onPress={() => {
                                    if (callback) {
                                        onCallback(j.master);
                                        return;
                                    }
                                    navigateToJettonTransfer(j);
                                }}
                            />
                        );
                    })}
                </View>
                <View style={{ height: safeArea.bottom }} />
            </ScrollView>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});