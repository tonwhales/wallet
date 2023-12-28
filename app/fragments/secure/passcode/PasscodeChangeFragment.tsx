import { View } from "react-native"
import { PasscodeChange } from "../../../components/secure/PasscodeChange";
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useTheme } from "../../../engine/hooks";

export const PasscodeChangeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('security.passcodeSettings.changeTitle')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <View style={{ paddingBottom: safeArea.bottom }}>
                <PasscodeChange />
            </View>
        </View>
    );
});