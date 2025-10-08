import { Platform } from "react-native";

export const isLatestIos = Platform.OS === 'ios' && Platform.Version >= '26';