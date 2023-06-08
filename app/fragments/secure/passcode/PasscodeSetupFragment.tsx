import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/passcode/PasscodeSetup";
import { getCurrentAddress } from "../../../storage/appState";
import { PasscodeState, encryptAndStoreWithPasscode } from "../../../storage/secureStorage";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useEngine } from "../../../engine/Engine";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { useReboot } from "../../../utils/RebootContext";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useRoute } from "@react-navigation/native";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { t } from "../../../i18n/t";
import { storage } from "../../../storage/storage";
import { passcodeSetupShownKey } from "../../resolveOnboarding";

export const PasscodeSetupFragment = systemFragment(() => {
    const { AppConfig } = useAppConfig();
    const engine = useEngine();
    const reboot = useReboot();
    const settings = engine?.products?.settings;
    const route = useRoute();
    const init = route.name === 'PasscodeSetupInit';
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        const acc = getCurrentAddress();

        try {
            let keys = await loadWalletKeys(acc.secretKeyEnc);
            await encryptAndStoreWithPasscode(
                acc.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                passcode,
                Buffer.from(keys.mnemonics.join(' '))
            );
            if (!!settings) {
                settings.setPasscodeState(
                    acc.address,
                    PasscodeState.Set
                );
            }
        } catch (e) {
            warn(`Failed to load wallet keys on PasscodeSetup ${init ? 'init' : 'change'}`);
            throw Error('Failed to load wallet keys');
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
                onLater={init ? () => {
                    storage.set(passcodeSetupShownKey, true)
                    if (engine && !engine.ready) {
                        navigation.navigateAndReplaceAll('Sync');
                    } else {
                        navigation.navigateAndReplaceAll('Home');
                    }
                } : undefined}
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