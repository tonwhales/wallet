import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/passcode/PasscodeSetup";
import { BiometricsState, PasscodeState, encryptAndStoreAppKeyWithPasscode, loadKeyStorageRef, loadKeyStorageType } from "../../../storage/secureStorage";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useEngine } from "../../../engine/Engine";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { useRoute } from "@react-navigation/native";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { t } from "../../../i18n/t";
import { storage } from "../../../storage/storage";
import { wasPasscodeSetupShownKey } from "../../resolveOnboarding";

export const PasscodeSetupFragment = systemFragment(() => {
    const engine = useEngine();
    const settings = engine?.products?.settings;
    const route = useRoute();
    const init = route.name === 'PasscodeSetupInit';
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const storageType = loadKeyStorageType();
    const isLocalAuth = storageType === 'local-authentication';
    const [showLater, setShowLater] = useState(init && !isLocalAuth);

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        try {
            await encryptAndStoreAppKeyWithPasscode(passcode);
        } catch {
            setShowLater(true);
            warn(`Failed to load wallet keys on PasscodeSetup ${init ? 'init' : 'change'}`);
            throw Error('Failed to load wallet keys');
        }

        try {
            if (!!settings) {
                settings.setPasscodeState(PasscodeState.Set);

                if (isLocalAuth) {
                    const ref = loadKeyStorageRef();
                    let key = (!!storage.getString('ton-storage-kind')) ? 'ton-storage-key-' + ref : ref;

                    // Remove old unencrypted key
                    storage.delete(key);
                    return;
                }

                // Set only if there is are biometrics to use
                settings.setBiometricsState(BiometricsState.InUse);
            }
        } catch {
            setShowLater(true);
            warn(`Failed to set passcode state on PasscodeSetup ${init ? 'init' : 'change'}`);
            throw Error('Failed to set passcode state');
        }

        if (init) {
            if (engine && !engine.ready) {
                navigation.navigateAndReplaceAll('Sync');
            } else {
                navigation.navigateAndReplaceAll('Home');
            }
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: (Platform.OS === 'android' || init)
                ? safeArea.top
                : undefined,
        }}>
            {!init && (<AndroidToolbar />)}
            <StatusBar style={(Platform.OS === 'ios' && !init) ? 'light' : 'dark'} />
            <PasscodeSetup
                description={init ? t('security.passcodeSettings.enterNewDescription') : undefined}
                onReady={onPasscodeConfirmed}
                initial={init}
                onLater={
                    showLater // Lock migation to passcode from local auth
                        ? () => {
                            storage.set(wasPasscodeSetupShownKey, true)
                            if (engine && !engine.ready) {
                                navigation.navigateAndReplaceAll('Sync');
                            } else {
                                navigation.navigateAndReplaceAll('Home');
                            }
                        }
                        : undefined
                }
                showSuccess={!init}
            />
            {Platform.OS === 'ios' && !init && (
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