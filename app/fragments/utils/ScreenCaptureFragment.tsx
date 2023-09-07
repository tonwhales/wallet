import { View, Text } from "react-native";
import { systemFragment } from "../../systemFragment";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";

export const ScreenCaptureFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <Pressable
                onPress={navigation.goBack}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
            <View style={{
                height: '50%',
                backgroundColor: Theme.white,
                borderTopEndRadius: 20, borderTopStartRadius: 20,
                padding: 16,
                paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom + 16
            }}>
                <Text style={{
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    color: Theme.textPrimary,
                    marginTop: 16,
                }}>
                    {t('screenCapture.title')}
                </Text>
                <Text style={{
                    fontSize: 17, lineHeight: 24,
                    fontWeight: '400',
                    color: Theme.textSecondary,
                    marginTop: 12,
                }}>
                    {t('screenCapture.description')}
                </Text>
                <View style={{ flexGrow: 1 }} />
                <RoundButton
                    style={{ marginVertical: 16 }}
                    onPress={navigation.goBack}
                    title={t('screenCapture.action')}
                />
            </View>
        </View>
    );
});