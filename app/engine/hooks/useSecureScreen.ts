import { useCallback, useEffect } from "react"
import { makeScreenSecure } from "../../modules/SecureScreen";
import { useFocusEffect } from "@react-navigation/native";
import { InteractionManager } from "react-native";
import { useScreenProtectorState } from "./settings/useScreenProtector";

export const useSecureScreen = () => {
    const [isScreenProtectorEnabled] = useScreenProtectorState();
    useFocusEffect(useCallback(() => {
        if (isScreenProtectorEnabled) {
            InteractionManager.runAfterInteractions(() => makeScreenSecure())
        }
        return () => {
            makeScreenSecure(false)
        }
    }, [isScreenProtectorEnabled]))
}