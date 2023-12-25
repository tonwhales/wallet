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

    backgroundPrimary: string,
    backgroundPrimaryInverted: string,
    backgroundUnchangeable: string,

    elevation: string,

    surfaceOnBg: string,
    surfaceOnElevation: string,
    surfaceOnDark: string,
    surfaceTab: string,

    cardStackSecond: string,
    cardStackThird: string,

    overlay: string,

    accent: string,
    accentDisabled: string,
    accentRed: string,
    accentGreen: string,
    accentBlue: string,

    textPrimary: string,
    textSecondary: string,
    textPrimaryInverted: string,
    textOnsurfaceOnDark: string,
    textUnchangeable: string,
    textThird: string,

    iconPrimary: string,
    iconUnchangeable: string,
    iconNav: string,

    divider: string,
    border: string,

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

    backgroundPrimary: '#FFFFFF',
    backgroundPrimaryInverted: '#000000',
    backgroundUnchangeable: '#000000',

    elevation: '#FFFFFF',

    surfaceOnBg: '#F7F8F9',
    surfaceOnElevation: '#F7F8F9',
    surfaceOnDark: '#2C2C2D',
    surfaceTab: '#FFFFFF',

    cardStackSecond: '#E9ECEE',
    cardStackThird: '#DFE1E5',

    overlay: 'rgba(0, 0, 0, 0.6)',

    accent: '#564CE2',
    accentDisabled: '#AAA5F0',
    accentRed: '#FF415C',
    accentGreen: '#00BE80',
    accentBlue: '#61BDFF',

    textPrimary: '#000',
    textSecondary: '#838D99',
    textPrimaryInverted: '#FFFFFF',
    textOnsurfaceOnDark: '#FFFFFF',
    textUnchangeable: '#FFFFFF',
    textThird: '#564CE2',

    iconPrimary: '#AAB4BF',
    iconUnchangeable: '#FFFFFF',
    iconNav: '#838D99',

    divider: '#E4E6EA',
    border: '#F7F8F9',

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

    backgroundPrimary: '#000000',
    backgroundPrimaryInverted: '#FFFFFF',

    elevation: '#1C1C1E',

    surfaceOnBg: '#1C1C1E',
    surfaceOnElevation: '#2C2C2D',
    surfaceTab: '#6A6A6C',

    cardStackSecond: '#191919',
    cardStackThird: '#0F0F0F',

    accent: '#5E54F2',
    accentDisabled: '#7F7BBB',

    textPrimary: '#FFFFFF',
    textSecondary: '#9398A1',
    textPrimaryInverted: '#000000',
    textThird: '#FFFFFF',

    iconPrimary: '#828B96',
    iconNav: '#A3A3AA',

    divider: '#444446',

    border: '#1C1C1E',
}

export const initialNavigationTheme: NavigationThemeType = {
    dark: false,
    colors: {
        ...DefaultTheme.colors,
        primary: baseTheme.accent,
        background: baseTheme.backgroundPrimary,
        card: baseTheme.backgroundPrimary
    }
};

const themeStyleKey = 'themeStyle';

export function getThemeStyleState() {
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