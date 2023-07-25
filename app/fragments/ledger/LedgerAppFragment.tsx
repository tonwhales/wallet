import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { LedgerApp } from "./components/LedgerApp";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";

export type LedgerAppParams = {
    address: { address: string, publicKey: Buffer },
};

export const LedgerAppFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { tonTransport, addr, setAddr } = useLedgerTransport();

    useEffect(() => {
        return () => {
            setAddr(null);
        }
    }, []);


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
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
})
