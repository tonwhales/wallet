import { DefaultTheme, Theme as NavigationThemeType } from "@react-navigation/native";
import { storage } from "../storage/storage";

export type ThemeStyle = 'light' | 'dark' | 'system';

export const themeStyleKey = 'appThemeStyle';

export function getStoredThemeStyle(): ThemeStyle {
    const stored = storage.getString(themeStyleKey);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    return 'system';
}

export function storeThemeStyle(style: ThemeStyle) {
    storage.set(themeStyleKey, style);
}

export type ThemeType = {
    style: 'light' | 'dark',
    background: string,
    backgroundUnchangeable: string,

    surfacePimary: string,
    surfaceSecondary: string,

    accent: string,
    accentPrimaryDisabledViolet: string,
    accentRed: string,
    accentGreen: string,
    accentBlue: string,

    textPrimary: string,
    textSecondary: string,
    textThird: string,

    iconPrimary: string,
    iconSecondary: string,

    divider: string,
    border: string,
    overlay: string,

    ton: string,
    telegram: string,

    transparent: string,
    white: string,
    black: string,

    cardBackground: string,
    warning: string,
};

export const baseTheme: ThemeType = {
    style: 'light',
    background: '#FFFFFF',
    backgroundUnchangeable: '#000000',

    surfacePimary: 'white',
    surfaceSecondary: '#F7F8F9',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#AAA5F0',
    accentRed: '#FF415C',
    accentGreen: '#00BE80',
    accentBlue: '#61BDFF',

    textPrimary: '#000',
    textSecondary: '#838D99',
    textThird: '#FFFFFF',

    iconPrimary: '#AAB4BF',
    iconSecondary: '#FFFFFF',

    divider: '#E4E6EA',
    border: '#F7F8F9',
    overlay: 'rgba(0, 0, 0, 0.6)',

    ton: '#0098EA',
    telegram: '#59ADE7',

    transparent: 'transparent',
    white: 'white',
    black: 'black',

    cardBackground: '#181524',
    warning: '#FF9A50'
}

export const darkTheme: ThemeType = {
    ...baseTheme,

    style: 'dark',

    background: '#000000',

    surfacePimary: '#1C1C1E',
    surfaceSecondary: '#2C2C2D',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#7F7BBB',

    textPrimary: '#FFFFFF',
    textSecondary: '#9398A1',

    iconPrimary: '#828B96',

    divider: '#444446',

    border: '#1C1C1E',
}

export const initialNavigationTheme: NavigationThemeType = {
    dark: false,
    colors: {
        ...DefaultTheme.colors,
        primary: baseTheme.accent,
        background: baseTheme.background,
        card: baseTheme.background
    }
};