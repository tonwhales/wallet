import { useCallback, useMemo } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import TonIcon from '../../../assets/ic-ton-acc.svg';
import { Address } from "@ton/core";
import { AnimatedProductButton } from "../wallet/products/AnimatedProductButton";
import { JettonProduct } from "../wallet/products/JettonProduct";
import { useLedgerTransport } from "./components/TransportContext";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useJettons, useTheme } from '../../engine/hooks';
import { useAccountLite } from '../../engine/hooks';
import { Jetton } from '../../engine/types';
import { CloseButton } from "../../components/navigation/CloseButton";

export const LedgerAssetsFragment = fragment(() => {
    const { target, callback } = useParams<{ target?: string, callback?: (address?: Address) => void }>();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { addr } = useLedgerTransport();
    const addressParsed = useMemo(() => Address.parse(addr!.address), [addr]);
    const address = useMemo(() => addressParsed.toString({ testOnly: false }), [addressParsed]);
    const jettons = useJettons(address);
    const account = useAccountLite(addressParsed);

    const navigateToJettonTransfer = useCallback((jetton: Jetton) => {
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
            <AndroidToolbar pageTitle={t('products.accounts')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17,
                        color: theme.textPrimary
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
                        value={account?.balance ?? BigInt(0)}
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
                    {jettons.map((j: any) => {
                        return (
                            <JettonProduct
                                key={'jt' + j.wallet.toString()}
                                jetton={j}
                                navigation={navigation}
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