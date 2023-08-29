import { DefaultTheme, Theme as NavigationThemeType } from '@react-navigation/native';
import { selector } from 'recoil';
import { networkSelector } from './network';

export type ThemeType = {
    textColor: string,
    textSecondary: string,
    textSubtitle: string,
    loader: string,
    background: string,
    item: string,

    accent: string,
    accentDark: string,
    accentText: string,

    warningText: string,
    warningSecondary: string,
    warningSecondaryBorder: string,

    linkText: string,

    divider: string,
    headerDivider: string,

    scoreGold: string,
    selector: string,
    secondaryButton: string,
    secondaryButtonText: string,
    success: string,
    failed: string,
    dangerZone: string,
    delete: string,
    qrCode: string,
    label: string,
    placeholder: string,
    labelSecondary: string,
    transparent: string,
    contactBorder: string,
    textSecondaryBorder: string,
    disabled: string,
    pressedRoundButton: string,
    telegram: string,

    price: string,
    priceSecondary: string,
    pricePositive: string,
    priceNegative: string,

    unchecked: string,
    contactIcon: string,
    operationIcon: string
};

const initialTheme = {
    textColor: '#000',
    textSecondary: '#8E8E92',
    textSubtitle: '#8E979D',
    loader: '#367CDE',
    background: '#F2F2F6',
    item: 'white',

    accent: '#47A9F1',
    accentDark: '#288FD8',
    accentText: '#1C8FE3',

    warningText: '#DE641F',
    warningSecondary: '#E19626',
    warningSecondaryBorder: '#FFC165',

    linkText: '#42A3EB',

    divider: '#E4E4E5',
    headerDivider: '#000',

    scoreGold: '#DAA520',
    selector: 'rgba(179, 179, 193, 0.3)',
    secondaryButton: '#E5E5E7',
    secondaryButtonText: '#798287',
    success: '#4DC47D',
    failed: 'orange',
    dangerZone: '#FF0000',
    delete: '#CF3535',
    qrCode: '#303757',
    label: '#7D858A',
    placeholder: '#9D9FA3',
    labelSecondary: '#858B93',
    transparent: 'transparent',
    contactBorder: '#DEDEDE',
    textSecondaryBorder: '#ADB6BE',
    disabled: '#9EA6AB',
    pressedRoundButton: 'rgba(0,0,0,0.3)',
    telegram: '#59ADE7',

    price: '#787F83',
    priceSecondary: '#6D6D71',
    pricePositive: '#4FAE42',
    priceNegative: '#FF0000',

    unchecked: '#B6B6BF',
    contactIcon: '#EDA652',
    operationIcon: '#60C75E',
}

export const initialNavigationTheme: NavigationThemeType = {
    dark: false,
    colors: {
        ...DefaultTheme.colors,
        primary: initialTheme.accent,
        background: initialTheme.background,
        card: initialTheme.background
    }
};

export const themeSelector = selector({
    key: 'theme',
    get: ({ get }) => {
        const isTestnet = get(networkSelector).isTestnet;

        return {
            ...initialTheme,
            accent: isTestnet ? '#F3A203' : '#47A9F1',
            accentDark: isTestnet ? '#F3A203' : '#288FD8',
            accentText: isTestnet ? '#E99A02' : '#1C8FE3',
        }
    }
});

export const navigationThemeSelector = selector({
    key: 'theme/navigation',
    get: ({ get }) => {
        const theme = get(themeSelector);
        return {
            dark: false,
            colors: {
                ...DefaultTheme.colors,
                primary: theme.accent,
                background: theme.background,
                card: theme.background
            }
        }
    } 
});