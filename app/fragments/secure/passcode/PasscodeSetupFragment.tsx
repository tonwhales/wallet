import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasscodeSetup } from "../../../components/passcode/PasscodeSetup";
import { BiometricsState, PasscodeState, encryptAndStoreAppKeyWithPasscode, loadKeyStorageRef, loadKeyStorageType, storeBiometricsState } from "../../../storage/secureStorage";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { useRoute } from "@react-navigation/native";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { t } from "../../../i18n/t";
import { storage } from "../../../storage/storage";
import { wasPasscodeSetupShownKey } from "../../resolveOnboarding";
import { useReboot } from "../../../utils/RebootContext";
import { useSetBiometricsState } from "../../../engine/hooks/appstate/useSetBiometricsState";
import { useSetPasscodeState } from "../../../engine/hooks/appstate/useSetPasscodeState";
import { CloseButton } from "../../../components/navigation/CloseButton";

export const PasscodeSetupFragment = systemFragment(() => {
    const reboot = useReboot();
    const route = useRoute();
    const init = route.name === 'PasscodeSetupInit';
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const storageType = loadKeyStorageType();
    const isLocalAuth = storageType === 'local-authentication';
    const setBiometricsState = useSetBiometricsState();
    const setPasscodeState = useSetPasscodeState();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        try {
            await encryptAndStoreAppKeyWithPasscode(passcode);
        } catch (e) {
            warn(`Failed to load wallet keys on PasscodeSetup ${init ? 'init' : 'change'}`);
            throw Error('Failed to load wallet keys');
        }
        try {
            setPasscodeState(PasscodeState.Set);
            if (isLocalAuth) {
                const ref = loadKeyStorageRef();
                let key = (!!storage.getString('ton-storage-kind')) ? 'ton-storage-key-' + ref : ref;

                // Remove old unencrypted key
                storage.delete(key);
            } else {
                // Set only if there are biometrics to use
                setBiometricsState(BiometricsState.InUse);
            }
        } catch {
            warn(`Failed to set passcode state on PasscodeSetup ${init ? 'init' : 'change'}`);
        }

        if (init) {
            reboot();
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
                    (init && !isLocalAuth) //Don't Allow to skip passcode setup on init and if local auth is enabled
                        ? () => {
                            storeBiometricsState(BiometricsState.InUse);
                            storage.set(wasPasscodeSetupShownKey, true)
                            reboot();
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