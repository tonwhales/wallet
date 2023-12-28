import { useCallback } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasscodeSetup } from "../../../components/passcode/PasscodeSetup";
import { BiometricsState, PasscodeState, encryptAndStoreAppKeyWithPasscode, loadKeyStorageRef, loadKeyStorageType } from "../../../storage/secureStorage";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { useRoute } from "@react-navigation/native";
import { t } from "../../../i18n/t";
import { storage } from "../../../storage/storage";
import { resolveOnboarding, wasPasscodeSetupShownKey } from "../../resolveOnboarding";
import { useSetBiometricsState } from "../../../engine/hooks/appstate/useSetBiometricsState";
import { useSetPasscodeState } from "../../../engine/hooks/appstate/useSetPasscodeState";
import { StatusBar } from "expo-status-bar";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useParams } from "../../../utils/useParams";

export const PasscodeSetupFragment = systemFragment(() => {
    const route = useRoute();
    const theme = useTheme();
    const { forceSetup } = useParams<{ forceSetup?: boolean }>();
    const init = route.name === 'PasscodeSetupInit';
    const safeArea = useSafeAreaInsets();
    const storageType = loadKeyStorageType();
    const isLocalAuth = storageType === 'local-authentication';
    const setBiometricsState = useSetBiometricsState();
    const setPasscodeState = useSetPasscodeState();
    const network = useNetwork();
    const navigation = useTypedNavigation();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        try {
            await encryptAndStoreAppKeyWithPasscode(passcode);
        } catch {
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

        if (forceSetup) {
            storage.set('key-store-migrated', true);
        }

        if (init) {
            const route = resolveOnboarding(network.isTestnet, false);
            navigation.navigateAndReplaceAll(route);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: (Platform.OS === 'android' || init)
                ? safeArea.top
                : undefined,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <PasscodeSetup
                description={init ? t('security.passcodeSettings.enterNewDescription') : undefined}
                onReady={onPasscodeConfirmed}
                initial={init}
                onLater={
                    //Don't Allow to skip passcode setup on init, if local auth is enabled or is forced
                    (init && !isLocalAuth && !forceSetup) 
                        ? () => {
                            setBiometricsState(BiometricsState.InUse);
                            storage.set(wasPasscodeSetupShownKey, true)
                            const route = resolveOnboarding(network.isTestnet, false);
                            navigation.navigateAndReplaceAll(route);
                        }
                        : undefined
                }
                forced={forceSetup}
                showToast={true}
                screenHeaderStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
});