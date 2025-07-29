import { BlurView } from "expo-blur";
import { createContext, useContext, useRef, useState } from "react";
import { Platform } from "react-native";
import Animated, { Easing, FadeOut } from "react-native-reanimated";

export const AppBlurContext = createContext<{
    blur: boolean,
    setBlur: (newState: boolean) => void,
    getBlur: () => boolean
    setAuthInProgress: (newState: boolean) => void
} | null>(null);

export const AppBlurContextProvider = ({ children }: { children: any }) => {
    const [blur, setBlurState] = useState(false);
    const blurRef = useRef(blur);
    const getBlur = () => blurRef.current;

    const authInProgressRef = useRef(false);
    const setAuthInProgress = (newState: boolean) => authInProgressRef.current = newState;

    const setBlur = (newState: boolean) => {
        // On iOS we don't want to show blur when auth is in progress (biometrics prompt is shown AppState is 'inactive')
        if (newState && authInProgressRef.current && Platform.OS === 'ios') {
            return;
        }
        blurRef.current = newState;
        setBlurState(newState);
    }

    return (
        <AppBlurContext.Provider value={{ blur, setBlur, getBlur, setAuthInProgress }}>
            {children}
            {blur
                ? (
                    <Animated.View
                        exiting={FadeOut.duration(350).easing(Easing.bezier(0.23, 1, 0.32, 1).factory())}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
                    >
                        <BlurView
                            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
                            intensity={30}
                        />
                    </Animated.View>
                )
                : null
            }
        </AppBlurContext.Provider>
    );
};

export function useAppBlur() {
    let res = useContext(AppBlurContext);
    if (!res) {
        throw Error('No AppBlur found');
    }
    return res;
}