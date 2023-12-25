import { Platform, View, Text } from "react-native"
import { fragment } from "../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useParams } from "../../utils/useParams";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";

export const AlertFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { title, message, callback } = useParams<{ title: string, message?: string, callback?: () => void }>();

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.OS === 'android' && (
                <ScreenHeader
                    onClosePressed={navigation.goBack}
                />
            )}
            {Platform.OS === 'ios' && (
                <View style={{ flexGrow: 1 }} />
            )}
            <View style={[
                {
                    flexShrink: Platform.OS === 'ios' ? 1 : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16,
                },
                Platform.select({ android: { flexGrow: 1 } })
            ]}>
                <Text style={{
                    fontSize: 32,
                    fontWeight: '600',
                    color: theme.textPrimary,
                    marginBottom: !!message ? 12 : 36,
                    marginTop: Platform.OS === 'ios' ? 16 : 0,
                }}>
                    {title}
                </Text>
                {!!message && (
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '400',
                        color: theme.textSecondary,
                        marginBottom: 36,
                    }}>
                        {message}
                    </Text>
                )}
                {Platform.OS === 'android' && (
                    <View style={{ flexGrow: 1 }} />
                )}
                <RoundButton
                    style={{ marginBottom: 16 }}
                    title={t('common.ok')}
                    onPress={() => {
                        navigation.goBack();
                        if (callback) {
                            setTimeout(() => {
                                callback();
                            }, 10);
                        }
                    }}
                />
            </View>
        </View>
    );
});