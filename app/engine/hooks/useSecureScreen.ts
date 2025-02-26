import { useEffect } from "react"
import { NativeModules, Platform } from "react-native";

const { FlagSecureModule } = NativeModules;

export const useSecureScreen = () => {
    useEffect(() => {
        if (Platform.OS === 'android') {
            FlagSecureModule.activate()
        }
        return () => {
            if (Platform.OS === 'android') {
                FlagSecureModule.deactivate()
            }
        }
    }, [])
}