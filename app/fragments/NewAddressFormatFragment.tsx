import { Platform, View, Text } from "react-native";
import { fragment } from "../fragment";
import { useNetwork, useTheme } from "../engine/hooks";
import { useBounceableWalletFormat, useSelectedAccount } from "../engine/hooks/appstate";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { Typography } from "../components/styles";
import { RoundButton } from "../components/RoundButton";

export const NewAddressFormatFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [bounceableFormat, setBounceableFormat] = useBounceableWalletFormat();
    const selectedAccount = useSelectedAccount();

    const oldAddressString = selectedAccount?.address.toString({ testOnly: network.isTestnet });
    const newAddressString = selectedAccount?.address.toString({ testOnly: network.isTestnet, bounceable: false });

    return (
        <View style={{
            flexGrow: 1,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('newAddressFormat.title')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { marginTop: safeArea.top } })}
            />
            <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
                <Text style={[{ color: theme.textPrimary, textAlign: 'center' }, Typography.semiBold32_38]}>
                    {t('newAddressFormat.fragmentTitle')}
                </Text>
                <Text style={[{ color: theme.textSecondary, textAlign: 'center' }, Typography.regular17_24]}>
                    {t('newAddressFormat.description_0')}
                </Text>
                <Text style={[{ color: theme.textSecondary, textAlign: 'center' }, Typography.regular17_24]}>
                    {t('newAddressFormat.description_1')}
                </Text>
            </View>
            <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 24 }}>
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 16,
                    paddingHorizontal: 16, paddingVertical: 10
                }}>
                    <Text style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                        {t('newAddressFormat.oldAddress')}
                    </Text>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                            {oldAddressString?.slice(0, 2)}
                        </Text>
                        {`${oldAddressString?.slice(2, 10)}...${oldAddressString?.slice(-10, -4)}`}
                        <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                            {oldAddressString?.slice(-4)}
                        </Text>
                    </Text>
                </View>
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 16,
                    paddingHorizontal: 16, paddingVertical: 10,
                }}>
                    <Text style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                        {t('newAddressFormat.newAddress')}
                    </Text>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                            {newAddressString?.slice(0, 2)}
                        </Text>
                        {`${newAddressString?.slice(2, 10)}...${newAddressString?.slice(-10, -4)}`}
                        <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                            {newAddressString?.slice(-4)}
                        </Text>
                    </Text>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ padding: 16 }}>
                <RoundButton
                    style={{ marginBottom: 8 }}
                    title={t(
                        'newAddressFormat.action',
                        { format: (!bounceableFormat ? t('newAddressFormat.oldAddress') : t('newAddressFormat.newAddress')).toLowerCase() }
                    )}
                    onPress={() => {
                        setBounceableFormat(!bounceableFormat);
                        navigation.goBack();
                    }}
                />
            </View>
        </View>
    );
});