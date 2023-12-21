import { createContext, useMemo } from 'react';
import { ThemeStyle, ThemeType, baseTheme, darkTheme, themeStyleState } from './state/theme';
import { useRecoilValue } from 'recoil';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext<ThemeType>(baseTheme);

export const ThemeProvider = (props: React.PropsWithChildren) => {
    const style = useRecoilValue(themeStyleState);
    const colorScheme = useColorScheme();

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