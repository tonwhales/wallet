import React, { useCallback, useState } from "react"
import { fragment } from "../fragment";
import { useEffect } from "react";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { resolveOnboarding } from "./resolveOnboarding";
import { t } from "../i18n/t";
import { useNetwork, useTheme } from "../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasscodeInput } from "../components/passcode/PasscodeInput";
import { sharedStoragePersistence, storage, storagePersistence } from "../storage/storage";
import { queryClient } from "../engine/clients";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { getCurrentAddress } from "../storage/appState";
import { loadWalletKeys } from "../storage/walletKeys";
import { BiometricsState, getBiometricsState, passcodeLengthKey } from "../storage/secureStorage";
import { Alert, View } from "react-native";
import { warn } from "../utils/log";

export const AppStartAuthFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const safeAreaInsets = useSafeAreaInsets();
    const { showActionSheetWithOptions } = useActionSheet();
    const biometricsState = getBiometricsState();
    const useBiometrics = (biometricsState === BiometricsState.InUse);

    const [attempts, setAttempts] = useState(0);

    const onFullReset = useCallback(() => {
        // clear storage
        storage.clearAll();
        sharedStoragePersistence.clearAll();
        storagePersistence.clearAll();

        // cancel running queries and clear query cache
        queryClient.cancelQueries();
        queryClient.clear();

        // navigate to welcome screen
        navigation.navigateAndReplaceAll('Welcome');
    }, []);

    const fullResetActionSheet = useCallback(() => {
        const options = [t('common.cancel'), t('deleteAccount.logOutAndDelete')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('confirm.logout.title'),
            message: t('confirm.logout.message'),
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    onFullReset();
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [onFullReset]);

    const onConfurmend = useCallback(() => {
        const route = resolveOnboarding(network.isTestnet, false);;
        navigation.navigateAndReplaceAll(route);
    }, []);

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const acc = getCurrentAddress();
    //             await loadWalletKeys(acc.secretKeyEnc);
    //             onConfurmend();
    //         } catch { } // ignore
    //     })();
    //     // setTimeout(() => {
    //     // }, 100);
    // }, []);

    return (
        <View
            style={[
                {
                    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                    backgroundColor: theme.backgroundPrimary,
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 0,
                    paddingBottom: safeAreaInsets.bottom === 0 ? 120 : safeAreaInsets.bottom,
                },
            ]}
        >
            <PasscodeInput
                style={{ marginTop: 49 }}
                title={t('security.passcodeSettings.enterCurrent')}
                description={t('appAuth.description')}
                onEntered={async (pass) => {
                    const acc = getCurrentAddress();
                    if (!pass) {
                        return;
                    }
                    try {
                        await loadWalletKeys(acc.secretKeyEnc, pass);
                        onConfurmend();
                    } catch {
                        setAttempts(attempts + 1);
                        throw Error('Failed to load keys');
                    }
                }}
                onMount={useBiometrics
                    ? async () => {
                        try {
                            const acc = getCurrentAddress();
                            await loadWalletKeys(acc.secretKeyEnc);
                            onConfurmend();
                        } catch { } // ignore
                    }
                    : undefined}
                onLogoutAndReset={
                    (attempts > 0
                        && attempts % 5 === 0
                    )
                        ? fullResetActionSheet
                        : undefined
                }
                passcodeLength={storage.getNumber(passcodeLengthKey) ?? 6}
                onRetryBiometrics={
                    (useBiometrics)
                        ? async () => {
                            try {
                                const acc = getCurrentAddress();
                                await loadWalletKeys(acc.secretKeyEnc);
                                onConfurmend()
                            } catch {
                                Alert.alert(t('secure.onBiometricsError'));
                                warn('Failed to load wallet keys');
                            }
                        }
                        : undefined
                }
            />
        </View>
    );
});