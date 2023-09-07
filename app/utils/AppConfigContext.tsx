import * as React from 'react';
import * as Application from 'expo-application';
import { storage, storagePersistence } from '../storage/storage';
import { DefaultTheme, Theme as NavigationThemeType } from "@react-navigation/native";
import { getCurrentAddress, markAddressSecured } from '../storage/appState';
import { useReboot } from './RebootContext';

export const isTestnetKey = 'isTestnet';

export type ThemeType = {
    background: string,
    backgroundUnchangeable: string,

    surfacePimary: string,
    surfaceSecondary: string,
    
    accent: string,
    accentPrimaryDisabledViolet: string,
    accentRed: string,
    accentGreen: string,
    accentBlue: string,
    
    textColor: string,
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
};

const initialTheme: ThemeType = {
    background: '#FFFFFF',
    backgroundUnchangeable: '#000000',

    surfacePimary: 'white',
    surfaceSecondary: '#F7F8F9',
    
    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#AAA5F0',
    accentRed: '#FF415C',
    accentGreen: '#00BE80',
    accentBlue: '#61BDFF',

    textColor: '#000',
    textSecondary: '#838D99',
    textThird: '#FFFFFF',
    
    iconPrimary: '#AAB4BF',
    iconSecondary: '#FFFFFF',

    divider: '#E4E6EA',
    border: '#F7F8F9',
    overlay: 'rgba(0, 0, 0, 0.60)',

    ton: '#0098EA',
    telegram: '#59ADE7',
    
    transparent: 'transparent',
    white: 'white',
    black: 'black',
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
    const reboot = useReboot();
    const [AppConfig, setAppConfig] = React.useState(initialAppConfig);

    const Theme = {
        ...initialTheme,
        accent: AppConfig.isTestnet ? '#564CE2' : '#564CE2',
    };

    const NavigationTheme = {
        dark: false,
        colors: {
            ...DefaultTheme.colors,
            primary: Theme.accent,
            background: Theme.white,
            card: Theme.white
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
            {props.children}
        </AppConfigContext.Provider>
    );
});

export function useAppConfig() {
    return React.useContext(AppConfigContext);
}