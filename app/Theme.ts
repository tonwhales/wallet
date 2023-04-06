import { DefaultTheme, Theme as ThemeType } from "@react-navigation/native";
import { AppConfig } from "./AppConfig";

export const Theme = {
    textColor: '#000',
    textSecondary: '#8E8E92',
    textSubtitle: '#8E979D',
    loader: '#367CDE',
    background: '#F2F2F6',
    item: 'white',

    accent: AppConfig.isTestnet ? '#F3A203' : '#47A9F1',
    accentDark: AppConfig.isTestnet ? '#F3A203' : '#288FD8',
    accentText: AppConfig.isTestnet ? '#E99A02' : '#1C8FE3',

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