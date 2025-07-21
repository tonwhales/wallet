import { useCallback } from "react"
import { toggleSecureScreen } from "../../modules/SecureScreen";
import { useFocusEffect } from "@react-navigation/native";
import { InteractionManager } from "react-native";
import { useScreenProtectorState } from "./settings/useScreenProtector";

export const useSecureScreen = () => {
    const [isScreenProtectorEnabled] = useScreenProtectorState();
    useFocusEffect(useCallback(() => {
        if (isScreenProtectorEnabled) {
            InteractionManager.runAfterInteractions(() => toggleSecureScreen())
        }
        return () => {
            toggleSecureScreen(false)
        }
    }, [isScreenProtectorEnabled]))
}