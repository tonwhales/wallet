import { DefaultTheme, Theme as ThemeType } from "@react-navigation/native";
import { AppConfig } from "./AppConfig";

export const Theme = {
    textColor: '#000',
    textSecondary: '#8E8E92',
    loader: '#367CDE',
    background: '#F2F2F6',

    accent: AppConfig.isTestnet ? '#F8C81C' : '#47A9F1',
    accentDark: AppConfig.isTestnet ? '#ECB800' : '#288FD8',
    accentText: AppConfig.isTestnet ? '#FAD202' : '#1C8FE3',

    divider: '#E4E4E5',
    warningText: '#DE641F',
    scoreGold: '#DAA520',
    selector: 'rgba(179, 179, 193, 0.3)',
    secondaryButton: '#E5E5E7',
    secondaryButtonText: '#798287',
};

export const NavigationTheme: ThemeType = {
    dark: false,
    colors: {
        ...DefaultTheme.colors,
        primary: Theme.accent,
        background: Theme.background,
        card: Theme.background
    }
};