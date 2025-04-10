import React, { useCallback, useEffect, useState } from "react"
import { fragment } from "../fragment";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { resolveOnboarding } from "./resolveOnboarding";
import { t } from "../i18n/t";
import { useNetwork, useTheme } from "../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasscodeInput } from "../components/passcode/PasscodeInput";
import { storage } from "../storage/storage";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { getCurrentAddress } from "../storage/appState";
import { SecureAuthenticationCancelledError, loadWalletKeys } from "../storage/walletKeys";
import { BiometricsState, getBiometricsState, passcodeLengthKey } from "../storage/secureStorage";
import { Alert, AppState, NativeEventSubscription, Platform, View } from "react-native";
import { useLogoutAndReset } from "../engine/hooks/accounts/useLogoutAndReset";
import { useRoute } from "@react-navigation/native";
import { updateLastAuthTimestamp } from "../components/secure/AuthWalletKeys";
import { useAppBlur } from "../components/AppBlurContext";
import { CachedLinking } from "../utils/CachedLinking";

export const AppAuthFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const safeAreaInsets = useSafeAreaInsets();
    const { showActionSheetWithOptions } = useActionSheet();
    const biometricsState = getBiometricsState();
    const useBiometrics = (biometricsState === BiometricsState.InUse);
    const logOutAndReset = useLogoutAndReset();
    const isAppStart = useRoute().name !== 'AppAuth';
    const { blur, setBlur, setAuthInProgress } = useAppBlur();

    const [attempts, setAttempts] = useState(0);

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
                    logOutAndReset(true);
                    navigation.navigateAndReplaceAll('Welcome');
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [logOutAndReset]);

    const onConfirmed = useCallback(() => {
        updateLastAuthTimestamp();

        // just in case
        setBlur(false);

        if (!isAppStart) {
            navigation.goBack();
            CachedLinking.openLastLink();
            return;
        }
        const route = resolveOnboarding(network.isTestnet, false);
        navigation.navigateAndReplaceAll(route);
    }, []);

    useEffect(() => {
        if (isAppStart) {
            return;
        }

        // lock native android navigation
        const subscription: NativeEventSubscription = AppState.addEventListener('change', (newState) => {
            if (newState === 'active') {
                setBlur(false);
            }
        });

        const transitionEndListener = navigation.base.addListener('transitionEnd', (e: any) => {
            // hide blur on screen enter animation end
            if (!e.data.closing) {
                const current = AppState.currentState;

                if (current === 'active') {
                    setBlur(false);
                }
            }
        });

        return () => {
            // Don't forget to remove the listener when the component is unmounted
            transitionEndListener.remove();
            subscription.remove();
        };
    }, []);

    const authenticateWithBiometrics = useCallback(async () => {
        if (!useBiometrics) {
            return;
        }
        try {
            setAuthInProgress(true);
            const acc = getCurrentAddress();
            await loadWalletKeys(acc.secretKeyEnc);
            onConfirmed();
        } catch (e) {
            if (e instanceof SecureAuthenticationCancelledError) {
                Alert.alert(
                    t('security.auth.canceled.title'),
                    t('security.auth.canceled.message'),
                    [{ text: t('common.ok') }]
                );
            }
        } finally {
            setAuthInProgress(false);
        }
    }, [useBiometrics]);

    return (
        <View
            style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                backgroundColor: Platform.select({
                    ios: isAppStart ? theme.backgroundPrimary : theme.elevation,
                    android: theme.backgroundPrimary
                }),
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 0,
                paddingBottom: safeAreaInsets.bottom === 0 ? 120 : safeAreaInsets.bottom,
            }}
        >
            {(blur && !isAppStart) ? (
                null
            ) : (
                <PasscodeInput
                    style={{ marginTop: 49 }}
                    title={t('security.passcodeSettings.enterCurrent')}
                    description={t('appAuth.description')}
                    onEntered={async (pass) => {
                        setAuthInProgress?.(true);
                        const acc = getCurrentAddress();
                        if (!pass) {
                            return;
                        }
                        try {
                            await loadWalletKeys(acc.secretKeyEnc, pass);
                            onConfirmed();
                        } catch (e) {
                            setAuthInProgress?.(false);
                            setAttempts(attempts + 1);
                            throw Error('Failed to load keys');
                        }
                    }}
                    onMount={useBiometrics ? authenticateWithBiometrics : undefined}
                    onLogoutAndReset={
                        attempts > 5
                            ? fullResetActionSheet
                            : undefined
                    }
                    passcodeLength={storage.getNumber(passcodeLengthKey) ?? 6}
                    onRetryBiometrics={useBiometrics ? authenticateWithBiometrics : undefined}
                />
            )}
        </View>
    );
});