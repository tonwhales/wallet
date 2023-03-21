import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { startWalletV4Sync } from "../../engine/sync/startWalletV4Sync";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { LedgerApp } from "./components/LedgerApp";
import { useTransport } from "./components/TransportContext";

export type LedgerAppParams = {
    address: { address: string, publicKey: Buffer },
};

export const LedgerAppFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const { ledgerConnection, tonTransport, addr } = useTransport();

    useEffect(() => {
        try {
            const parsed = Address.parse(addr!.address);
            startWalletV4Sync(parsed, engine);
        } catch (e) {
            // Just in case
            warn('Failed to parse address');
            navigation.popToTop();
        }
    }, [addr, ledgerConnection, tonTransport]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('hardwareWallet.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('hardwareWallet.title')}
                    </Text>
                </View>
            )}
            {addr && tonTransport && (
                <LedgerApp
                    transport={tonTransport}
                    account={addr.acc}
                    address={addr}
                />
            )}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
})
