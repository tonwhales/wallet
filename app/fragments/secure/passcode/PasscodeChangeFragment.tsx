import { Platform, View, Text } from "react-native"
import { PasscodeChange } from "../../../components/secure/PasscodeChange";
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../../components/CloseButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { useTheme } from "../../../engine/hooks";

export const PasscodeChangeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('security.passcodeSettings.changeTitle')} />
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
                        {t('security.passcodeSettings.changeTitle')}
                    </Text>
                </View>
            )}
            <PasscodeChange />
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