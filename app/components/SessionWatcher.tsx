import { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useLockAppWithAuthState } from "../engine/hooks/settings";
import { getLastAuthTimestamp } from "./secure/AuthWalletKeys";
import { useAppBlur } from "./AppBlurContext";
import { getLockAppWithAuthState } from "../engine/state/lockAppWithAuthState";

const appLockTimeout = 1000 * 60 * 10; // 10 minutes

export function isAuthTimedOut() {
    const lastAuthAt = getLastAuthTimestamp() ?? 0;
    return lastAuthAt + appLockTimeout < Date.now();
}

export function shouldLockApp() {
    const lockAppWithAuth = getLockAppWithAuthState();
    const timedOut = isAuthTimedOut();
    return lockAppWithAuth && timedOut;
}

export const SessionWatcher = (({ navRef }: { navRef: NavigationContainerRefWithCurrent<any> }) => {
    const [locked] = useLockAppWithAuthState();
    const lastStateRef = useRef<string | null>(null);
    const { setBlur } = useAppBlur();
    useEffect(() => {
        if (!locked) {
            setBlur(false);
            return;
        }

        const checkAndNavigate = () => {
            const shouldLock = shouldLockApp();
            if (shouldLock) {
                navRef.navigate('AppAuth');
            } else {
                setBlur(false);
            }
        }

        const subscription = AppState.addEventListener('change', (newState) => {

            if (Platform.OS === 'ios') { // ios goes to inactive on biometric auth
                if (newState === 'background') {
                    setBlur(true);
                } else if (newState === 'inactive') {
                    setBlur(true);
                } else if (newState === 'active' && lastStateRef.current === 'background') {
                    checkAndNavigate();
                } else {
                    setBlur(false);
                }
            } else {
                if (newState === 'background') {
                    setBlur(true);
                } else if (newState === 'active' && lastStateRef.current === 'background') {
                    checkAndNavigate();
                } else {
                    setBlur(false);
                }
            }

            // update last state
            lastStateRef.current = newState;
        });

        return () => {
            subscription.remove();
        };
    }, [locked]);
    return null;
});