import { useCallback, useEffect } from "react"
import { makeScreenSecure } from "../../modules/SecureScreen";
import { useFocusEffect } from "@react-navigation/native";
import { InteractionManager } from "react-native";

export const useSecureScreen = () => {
    useFocusEffect(useCallback(() => {
        InteractionManager.runAfterInteractions(() => makeScreenSecure())
        return () => {
            makeScreenSecure(false)
        }
    }, []))
}