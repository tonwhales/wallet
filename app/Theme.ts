import { DefaultTheme, Theme as ThemeType } from "@react-navigation/native";
import { AppConfig } from "./AppConfig";

export const Theme = {
    textColor: '#000',
    textSecondary: '#8E8E92',
    textSubtitle: '#8E979D',
    loader: '#367CDE',
    background: '#F2F2F6',
    item: 'white',

    accent: AppConfig.isTestnet ? '#F3A203' : '#1D94EB',
    accentDark: AppConfig.isTestnet ? '#F3A203' : '#288FD8',
    accentText: AppConfig.isTestnet ? '#E99A02' : '#1C8FE3',

    divider: '#E4E4E5',
    warningText: '#DE641F',
    scoreGold: '#DAA520',
    selector: 'rgba(179, 179, 193, 0.3)',
    secondaryButton: '#E5E5E7',
    secondaryButtonText: '#798287',
    success: '#4DC47D',
    dangerZone: '#FF0000',
    qrCode: '#303757',
    price: '#787F83'
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