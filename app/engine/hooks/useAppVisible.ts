import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export function useAppVisible() {
    // persist the current app state across re-renders and to provide a mutable reference
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
            setAppStateVisible(appState.current);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return appStateVisible;
}