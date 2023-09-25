import * as React from 'react';
import * as Application from 'expo-application';
import { storage, storagePersistence } from '../storage/storage';
import { DefaultTheme, Theme as NavigationThemeType } from "@react-navigation/native";
import { getCurrentAddress, markAddressSecured } from '../storage/appState';
import { useReboot } from './RebootContext';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { changeNavBarColor } from '../components/modules/NavBar';
import { ThemeStyle, ThemeType, baseTheme, darkTheme, getStoredThemeStyle, initialNavigationTheme, storeThemeStyle } from './Theme';

export const isTestnetKey = 'isTestnet';

export const initialAppConfig = {
    version: Application.nativeApplicationVersion,
    isTestnet: (storage.getBoolean(isTestnetKey) !== undefined)
        ? storage.getBoolean(isTestnetKey) === true
        : (
            Application.applicationId === 'com.tonhub.app.testnet' ||
            Application.applicationId === 'com.tonhub.app.debug.testnet' ||
            Application.applicationId === 'com.tonhub.wallet.testnet' ||
            Application.applicationId === 'com.tonhub.wallet.testnet.debug' ||
            Application.applicationId === 'com.sandbox.app.zenpay.demo' ||
            Application.applicationId === 'com.sandbox.app.zenpay.demo.debug'
        ),
};

export const AppConfigContext = createContext<{
    AppConfig: {
        version: string | null;
        isTestnet: boolean;
    },
    setNetwork: (isTestnet: boolean) => void;
    changeTheme: (themeStyle: ThemeStyle) => void;
    Theme: ThemeType;
    themeStyle: ThemeStyle;
    NavigationTheme: NavigationThemeType;
}>({
    AppConfig: initialAppConfig,
    setNetwork: () => {},
    changeTheme: () => {},
    Theme: baseTheme,
    themeStyle: 'light',
    NavigationTheme: initialNavigationTheme
});

export const AppConfigContextProvider = memo((props: { children: React.ReactNode }) => {
    const reboot = useReboot();
    const [AppConfig, setAppConfig] = useState(initialAppConfig);

    const colorScheme = useColorScheme();
    const storedThemeStyle = getStoredThemeStyle();
    const initThemeStyle = useMemo(() => {
        if (storedThemeStyle === 'system') {
            return colorScheme === 'dark' ? 'dark' : 'light';
        }
        return storedThemeStyle;
    }, [colorScheme]);
    const initTheme = {
        Theme: initThemeStyle === 'dark' ? darkTheme : baseTheme,
        themeStyle: storedThemeStyle,
    };
    const [{ Theme, themeStyle }, setTheme] = useState(initTheme);

    const changeTheme = useCallback((newStyle: ThemeStyle) => {
        storeThemeStyle(newStyle);

        if (newStyle === 'system') {
            setTheme({
                Theme: colorScheme === 'dark' ? darkTheme : baseTheme,
                themeStyle: 'system',
            });
        }

        setTheme({
            Theme: newStyle === 'dark' ? darkTheme : baseTheme,
            themeStyle: newStyle,
        });
    }, [colorScheme]);

    const NavigationTheme = {
        dark: false,
        colors: {
            ...DefaultTheme.colors,
            primary: Theme.accent,
            background: Theme.background,
            card: Theme.background,
            text: Theme.textPrimary,
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
    };

    useEffect(() => {
        changeNavBarColor(Theme.surfacePimary);
    }, [Theme]);

    useEffect(() => {
        const storedThemeStyle = getStoredThemeStyle();
        if (storedThemeStyle === 'system') {
            setTheme({
                Theme: colorScheme === 'dark' ? darkTheme : baseTheme,
                themeStyle: 'system',
            });
        }
    }, [colorScheme]);

    return (
        <AppConfigContext.Provider value={{ AppConfig, setNetwork, Theme, NavigationTheme, changeTheme, themeStyle }}>
            {props.children}
        </AppConfigContext.Provider>
    );
});

export function useAppConfig() {
    return useContext(AppConfigContext);
}