import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeStyle, ThemeType, baseTheme, darkTheme, themeStyleState } from './state/theme';
import { useRecoilValue } from 'recoil';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext<ThemeType>(baseTheme);

function useForegroundColorScheme() {
    const colorScheme = useColorScheme()
    const [currentColorScheme, setCurrentColorScheme] = useState(colorScheme)
    const onColorSchemeChange = useRef<NodeJS.Timeout>()

    // Add a 300ms delay before switching color scheme
    // Cancel if color scheme immediately switches back
    useEffect(() => {
        if (colorScheme !== currentColorScheme) {
            onColorSchemeChange.current = setTimeout(() => setCurrentColorScheme(colorScheme), 300)
        } else if (onColorSchemeChange.current) {
            clearTimeout(onColorSchemeChange.current)
        }
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