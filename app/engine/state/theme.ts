import { DefaultTheme, Theme as NavigationThemeType } from '@react-navigation/native';
import { atom } from 'recoil';
import { storagePersistence } from '../../storage/storage';
import { z } from "zod";

export enum ThemeStyle {
    Light = 'light',
    Dark = 'dark',
    System = 'system'
}

export type ThemeType = {
    style: Exclude<ThemeStyle, ThemeStyle.System>,

    background: string,
    backgroundInverted: string,
    backgroundUnchangeable: string,

    surfacePimary: string,
    surfaceSecondary: string,

    accent: string,
    accentPrimaryDisabledViolet: string,
    accentRed: string,
    accentGreen: string,
    accentBlue: string,

    textPrimary: string,
    textPrimaryInverted: string,
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
    warning: string
};

export const baseTheme: ThemeType = {
    style: ThemeStyle.Light,

    background: '#FFFFFF',
    backgroundInverted: '#000000',
    backgroundUnchangeable: '#000000',

    surfacePimary: 'white',
    surfaceSecondary: '#F7F8F9',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#AAA5F0',
    accentRed: '#FF415C',
    accentGreen: '#00BE80',
    accentBlue: '#61BDFF',

    textPrimary: '#000',
    textPrimaryInverted: '#FFFFFF',
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

    style: ThemeStyle.Dark,

    background: '#000000',
    backgroundInverted: '#FFFFFF',

    surfacePimary: '#1C1C1E',
    surfaceSecondary: '#2C2C2D',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#7F7BBB',

    textPrimary: '#FFFFFF',
    textPrimaryInverted: '#000000',
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

const themeStyleKey = 'themeStyle';

function getThemeStyleState() {
    const res = storagePersistence.getString(themeStyleKey);

    if (z.union([z.literal('light'), z.literal('dark'), z.literal('system')]).safeParse(res).success) {
        return res as ThemeStyle;
    }

    return ThemeStyle.System;
}

function storeThemeStyleState(state: ThemeStyle) {
    storagePersistence.set(themeStyleKey, state);
}

export const themeStyleState = atom<ThemeStyle>({
    key: 'theme/style',
    default: getThemeStyleState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeThemeStyleState(newValue);
        })
    }]
});