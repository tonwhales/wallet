import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeStyle, ThemeType, baseTheme, darkTheme, themeStyleState } from './state/theme';
import { useRecoilValue } from 'recoil';
import { Platform, useColorScheme } from 'react-native';
import { AndroidAppearance } from '../modules/AndroidAppearance';
import { changeNavBarColor } from '../modules/NavBar';

export const ThemeContext = createContext<ThemeType>(baseTheme);

function usePlatformColorScheme() {
    const colorScheme = useColorScheme();
    const andColorScheme = AndroidAppearance.useColorScheme();

    return Platform.select({ ios: colorScheme, android: andColorScheme });
}

function useForegroundColorScheme() {
    const colorScheme = usePlatformColorScheme();
    const style = useRecoilValue(themeStyleState);
    const [currentColorScheme, setCurrentColorScheme] = useState(colorScheme);
    const onColorSchemeChange = useRef<NodeJS.Timeout>();

    // Add a 300ms delay before switching color scheme
    // Cancel if color scheme immediately switches back
    useEffect(() => {
        if (onColorSchemeChange.current) {
            clearTimeout(onColorSchemeChange.current);
        }
        onColorSchemeChange.current = setTimeout(() => {
            if(style === ThemeStyle.System) {
                changeNavBarColor(colorScheme === 'dark' ? '#1C1C1E' : '#F7F8F9');
            } else {
                changeNavBarColor(style === ThemeStyle.Dark ? '#1C1C1E' : '#F7F8F9');
            }
            setCurrentColorScheme(colorScheme);
        }, 300);
    }, [colorScheme]);

    return currentColorScheme;
}

export const ThemeProvider = (props: React.PropsWithChildren) => {
    const style = useRecoilValue(themeStyleState);
    const colorScheme = useForegroundColorScheme();

    const themeStyle = useMemo(() => {
        if (style === ThemeStyle.System) {
            return colorScheme === 'dark' ? ThemeStyle.Dark : ThemeStyle.Light;
        }
        return style;
    }, [colorScheme, style]);

    const theme = useMemo(() => {
        const theme = themeStyle === ThemeStyle.Dark ? darkTheme : baseTheme;

        return {
            ...theme,
            style: theme.style as Exclude<ThemeStyle, ThemeStyle.System>,
        };
    }, [themeStyle]);

    return (
        <ThemeContext.Provider value={theme}>
            {props.children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.name = 'ThemeProvider';