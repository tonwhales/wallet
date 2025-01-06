import { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useLockAppWithAuthState } from "../engine/hooks/settings";
import { getLastAuthTimestamp } from "./secure/AuthWalletKeys";
import { useAppBlur } from "./AppBlurContext";
import { getLockAppWithAuthState } from "../engine/state/lockAppWithAuthState";

const appLockTimeout = 1000 * 60 * 15; // 15 minutes

export function shouldLockApp() {
    const lastAuthAt = getLastAuthTimestamp() ?? 0;
    const lockAppWithAuth = getLockAppWithAuthState();

    const timedOut = lastAuthAt + appLockTimeout < Date.now();
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
            if (shouldLockApp()) {
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