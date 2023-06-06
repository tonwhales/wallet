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

export const PasscodeSetupFragment = systemFragment(() => {
    const engine = useEngine();
    const { AppConfig } = useAppConfig();
    const reboot = useReboot();
    const settings = engine?.products?.settings;
    const route = useRoute();
    const init = route.name === 'PasscodeSetupInit';

    // TODO: ADD MIGRATION ONBOASRDING
    const { initial, afterImport } = useParams<{ initial?: boolean, afterImport?: boolean }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const inModalMode = useMemo(() => {
        return !initial && !afterImport && !init;
    }, [initial, afterImport, init]);

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
            warn(`Failed to load wallet keys, ${initial ? 'initial' : ''} ${afterImport ? 'after import' : ''}`);
            throw Error('Failed to load wallet keys');
        }

        if (initial || afterImport) {
            if (afterImport) {
                reboot();
                return;
            }

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
            paddingTop: (Platform.OS === 'android' || initial || afterImport || init)
                ? safeArea.top
                : undefined,
        }}>
            {inModalMode && (<AndroidToolbar />)}
            <StatusBar style={(Platform.OS === 'ios' && inModalMode) ? 'light' : 'dark'} />
            <PasscodeSetup
                initial={initial}
                afterImport={afterImport}
                onReady={onPasscodeConfirmed}
                migrating={init}
                showSuccess={!init}
            />
            {Platform.OS === 'ios' && inModalMode && (
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