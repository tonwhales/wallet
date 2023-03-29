import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, View, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../../components/AndroidToolbar";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/Passcode/PasscodeSetup";
import { fragment } from "../../../fragment"
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";

export const PasscodeSetupFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('security.passcodeSettings.setupTitle')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('security.passcodeSettings.setupTitle')}
                    </Text>
                </View>
            )}
            <KeyboardAvoidingView
                style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <PasscodeSetup />
            </KeyboardAvoidingView>
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