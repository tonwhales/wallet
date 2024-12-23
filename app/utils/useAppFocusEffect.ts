import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useAppFocusEffect(callback: () => void) {
    const lastStateRef = useRef(AppState.currentState);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextAppState) => {
            if (
                lastStateRef.current.match(/inactive|background/)
                && nextAppState === 'active'
            ) {
                console.log('App has come to the foreground!');
                callback();
            }
            lastStateRef.current = nextAppState
        });

        return () => sub.remove();
    }, [callback]);
}