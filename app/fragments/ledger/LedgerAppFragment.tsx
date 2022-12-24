import { StatusBar } from "expo-status-bar";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TonTransport } from "ton-ledger";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { LedgerAccountLoader } from "../../engine/LedgerAccountContext";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { LedgerApp } from "./components/LedgerApp";

export type LedgerAppParams = {
    account: number,
    address: { address: string, publicKey: Buffer },
    device: TonTransport,
};

export const LedgerAppFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { account, address, device } = useParams<LedgerAppParams>();
    const engine = useEngine();

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
            {device && account !== null && address !== null && (
                <LedgerAccountLoader address={address.address}>
                    <LedgerApp
                        transport={device}
                        account={account}
                        address={address}
                        tonClient4={engine.client4}
                    />
                </LedgerAccountLoader>
            )}
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
})
