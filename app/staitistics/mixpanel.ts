import { Mixpanel } from "mixpanel-react-native";
import { AppConfig } from "../AppConfig";

export const mixpanel = __DEV__
    ? new Mixpanel("b4b856b618ade30de503c189af079566") // Dev mode
    : AppConfig.isTestnet
        ? new Mixpanel("3f9efc81525f5bc5e5d047595d4d8ac9") // Sandbox
        : new Mixpanel("67a554fa4f2b98ae8785878bb4de73dc"); // Production