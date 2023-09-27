import { Platform, View } from "react-native"
import { PasscodeChange } from "../../../components/secure/PasscodeChange";
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { t } from "../../../i18n/t";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useNavigation } from "@react-navigation/native";

export const PasscodeChangeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 64 : safeArea.bottom + 80,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader title={t('security.passcodeSettings.changeTitle')} onClosePressed={navigation.goBack} />
            <PasscodeChange />
        </View>
    );
});