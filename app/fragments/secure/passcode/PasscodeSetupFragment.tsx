import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/secure/PasscodeSetup";
import { fragment } from "../../../fragment"
import { getCurrentAddress } from "../../../storage/appState";
import { PasscodeState, encryptAndStoreWithPasscode } from "../../../storage/secureStorage";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useEngine } from "../../../engine/Engine";
import { warn } from "../../../utils/log";

export const PasscodeSetupFragment = fragment(() => {
    const engine = useEngine();
    const settings = engine.products.settings;
    const { initial } = useParams<{ initial?: boolean }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        if (initial) {
            const acc = getCurrentAddress();
            let keys = await loadWalletKeys(acc.secretKeyEnc);
            await encryptAndStoreWithPasscode(passcode, Buffer.from(keys.mnemonics.join(' ')));
            settings.setPasscodeState(PasscodeState.Set);
            if (engine && !engine.ready) {
                navigation.navigateAndReplaceAll('Sync');
            } else {
                navigation.navigateAndReplaceAll('Home');
            }
        } else {
            try {
                const acc = getCurrentAddress();
                let keys = await loadWalletKeys(acc.secretKeyEnc);
                await encryptAndStoreWithPasscode(passcode, Buffer.from(keys.mnemonics.join(' ')));
                settings.setPasscodeState(PasscodeState.Set);
            } catch (e) {
                warn('Failed to encrypt and store with passcode');
            }
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: (Platform.OS === 'android' || initial)
                ? safeArea.top
                : undefined,
        }}>
            <StatusBar style={(Platform.OS === 'ios' && !initial) ? 'light' : 'dark'} />
            <KeyboardAvoidingView
                style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <PasscodeSetup onReady={onPasscodeConfirmed} />
            </KeyboardAvoidingView>
            {Platform.OS === 'ios' && !initial && (
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