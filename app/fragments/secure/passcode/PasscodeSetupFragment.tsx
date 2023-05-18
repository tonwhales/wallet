import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/secure/PasscodeSetup";
import { getCurrentAddress } from "../../../storage/appState";
import { PasscodeState, encryptAndStoreWithPasscode, passcodeStateKey } from "../../../storage/secureStorage";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useEngine } from "../../../engine/Engine";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { storage } from "../../../storage/storage";
import { useReboot } from "../../../utils/RebootContext";

export const PasscodeSetupFragment = systemFragment(() => {
    const engine = useEngine();
    const reboot = useReboot();
    const settings = engine?.products?.settings;
    const { initial, afterImport } = useParams<{ initial?: boolean, afterImport?: boolean }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const acc = getCurrentAddress();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        if (initial || afterImport) {
            let keys = await loadWalletKeys(acc.secretKeyEnc);
            await encryptAndStoreWithPasscode(
                acc.address.toFriendly({ testOnly: engine?.isTestnet }),
                passcode,
                Buffer.from(keys.mnemonics.join(' '))
            );
            if (!!settings) {
                settings.setPasscodeState(
                    acc.address,
                    PasscodeState.Set
                );
            } else {
                storage.set(
                    `${acc.address.toFriendly({ testOnly: engine.isTestnet })}/${passcodeStateKey}`,
                    PasscodeState.Set
                );
            }
            if (afterImport) {
                reboot();
                return;
            }
            if (engine && !engine.ready) {
                navigation.navigateAndReplaceAll('Sync');
            } else {
                navigation.navigateAndReplaceAll('Home');
            }
        } else {
            try {
                const acc = getCurrentAddress();
                let keys = await loadWalletKeys(acc.secretKeyEnc);
                await encryptAndStoreWithPasscode(
                    acc.address.toFriendly({ testOnly: engine?.isTestnet }),
                    passcode,
                    Buffer.from(keys.mnemonics.join(' '))
                );
                if (!!settings) {
                    settings.setPasscodeState(
                        acc.address,
                        PasscodeState.Set
                    );
                } else {
                    storage.set(
                        `${acc.address.toFriendly({ testOnly: engine.isTestnet })}/${passcodeStateKey}`,
                        PasscodeState.Set
                    );
                }
            } catch (e) {
                warn('Failed to encrypt and store with passcode');
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
            {Platform.OS === 'ios' && !initial && !afterImport && (
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