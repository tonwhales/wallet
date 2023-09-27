import { Platform, View, Text, Pressable } from "react-native"
import { fragment } from "../../fragment"
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const AlertFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();
    const { title, message } = useParams<{ title: string, message?: string }>();

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? Theme.background : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios'
                ? 'light'
                : Theme.style === 'dark' ? 'light' : 'dark'
            } />
            <AndroidToolbar />
            <View style={{ flexGrow: 1 }} />
            <View style={{
                flexShrink: Platform.OS === 'ios' ? 1 : undefined,
                flexGrow: Platform.OS === 'ios' ? 0 : 1,
                backgroundColor: Theme.background,
                borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                padding: 16,
                paddingBottom: safeArea.bottom + 16
            }}>
                <Text style={{
                    fontSize: 32,
                    fontWeight: '600',
                    color: Theme.textPrimary,
                    marginBottom: !!message ? 12 : 36,
                    marginTop: Platform.OS === 'ios' ? 16 : 0,
                }}>
                    {title}
                </Text>
                {!!message && (
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '400',
                        color: Theme.textSecondary,
                        marginBottom: 36,
                    }}>
                        {message}
                    </Text>
                )}
                <RoundButton
                    style={{ marginBottom: 16 }}
                    title={t('common.ok')}
                    onPress={navigation.goBack}
                />
            </View>
        </View>
    );
});