import { Platform } from "react-native";

export const isAfterGlassIOS = Platform.OS === 'ios' && Platform.Version >= '26';