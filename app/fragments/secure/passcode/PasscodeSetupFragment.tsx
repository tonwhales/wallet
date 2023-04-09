import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/Passcode/PasscodeSetup";
import { fragment } from "../../../fragment"
import { getCurrentAddress } from "../../../storage/appState";
import { encryptAndStoreWithPasscode } from "../../../storage/secureStorage";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";

export const PasscodeSetupFragment = fragment(() => {
    const { initial } = useParams<{ initial?: boolean }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        if (initial) {
            // navigation.navigate('Home');
        } else {
            const acc = getCurrentAddress();
            let keys = await loadWalletKeys(acc.secretKeyEnc);
            encryptAndStoreWithPasscode(passcode, Buffer.from(keys.mnemonics.join(' ')));
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <KeyboardAvoidingView
                style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <PasscodeSetup onReady={onPasscodeConfirmed} />
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