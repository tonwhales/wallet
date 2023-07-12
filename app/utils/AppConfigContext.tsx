import * as React from 'react';
import * as Application from 'expo-application';
import { storage, storagePersistence } from '../storage/storage';
import { DefaultTheme, Theme as NavigationThemeType } from "@react-navigation/native";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getCurrentAddress, markAddressSecured } from '../storage/appState';
import { useEffect } from 'react';

export const isTestnetKey = 'isTestnet';

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
    operationIcon: string,

    // new colors
    lightGrey: string,
    darkGrey: string,
    mediumGrey: string,
    green: string,
    accentRed: string
};

const initialTheme = {
    textColor: '#000',
    textSecondary: '#8E8E92',
    textSubtitle: '#8E979D',
    loader: '#367CDE',
    background: '#F2F2F6',
    item: 'white',

    accent: '#564CE2',
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

    // new colors
    lightGrey: '#F7F8F9',
    darkGrey: '#838D99',
    mediumGrey: '#E4E6EA',
    green: '#00BE80',
    accentRed: '#ff415c'
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

export const initialAppConfig = {
    version: Application.nativeApplicationVersion,
    isTestnet: (
        Application.applicationId === 'com.tonhub.app.testnet' ||
        Application.applicationId === 'com.tonhub.app.debug.testnet' ||
        Application.applicationId === 'com.tonhub.wallet.testnet' ||
        Application.applicationId === 'com.tonhub.wallet.testnet.debug' ||
        Application.applicationId === 'com.sandbox.app.zenpay.demo' ||
        Application.applicationId === 'com.sandbox.app.zenpay.demo.debug' ||
        storage.getBoolean(isTestnetKey) === true
    ),
};

export const AppConfigContext = React.createContext<{
    AppConfig: {
        version: string | null;
        isTestnet: boolean;
    },
    setNetwork: (isTestnet: boolean) => void;
    Theme: ThemeType;
    NavigationTheme: NavigationThemeType;
}>({
    AppConfig: initialAppConfig,
    setNetwork: () => { },
    Theme: initialTheme,
    NavigationTheme: initialNavigationTheme
});

export const AppConfigContextProvider = React.memo((props: { children: React.ReactNode }) => {
    const [sessionId, setSessionId] = React.useState(0);
    const reboot = React.useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);
    const [AppConfig, setAppConfig] = React.useState(initialAppConfig);

    const Theme = {
        ...initialTheme,
        accent: AppConfig.isTestnet ? '#564CE2' : '#564CE2',
        accentDark: AppConfig.isTestnet ? '#F3A203' : '#288FD8',
        accentText: AppConfig.isTestnet ? '#E99A02' : '#1C8FE3',
    };

    const NavigationTheme = {
        dark: false,
        colors: {
            ...DefaultTheme.colors,
            primary: Theme.accent,
            background: 'white',
            card: 'white'
        }
    }

    const setNetwork = (isTestnet: boolean) => {
        const addr = getCurrentAddress();
        markAddressSecured(addr.address, isTestnet);
        storage.set(isTestnetKey, isTestnet);
        setAppConfig({
            ...AppConfig,
            isTestnet,
        });
        storagePersistence.clearAll();
        reboot();
    };

    return (
        <AppConfigContext.Provider value={{ AppConfig, setNetwork, Theme, NavigationTheme }}>
            <Animated.View
                key={'session-' + sessionId}
                style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
                exiting={FadeOut}
                entering={FadeIn}
            >
                {props.children}
            </Animated.View>
        </AppConfigContext.Provider>
    );
});

export function useAppConfig() {
    return React.useContext(AppConfigContext);
}