import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
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

export const PasscodeSetupFragment = systemFragment(() => {
    const engine = useEngine();
    const { AppConfig } = useAppConfig();
    const reboot = useReboot();
    const settings = engine?.products?.settings;
    const { initial, afterImport } = useParams<{ initial?: boolean, afterImport?: boolean }>();
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
            paddingTop: (Platform.OS === 'android' || initial || afterImport)
                ? safeArea.top
                : undefined,
        }}>
            <StatusBar style={(Platform.OS === 'ios' && !initial && !afterImport) ? 'light' : 'dark'} />
            <PasscodeSetup
                initial={initial}
                afterImport={afterImport}
                onReady={onPasscodeConfirmed}
            />
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});