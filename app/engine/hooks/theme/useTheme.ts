import { useRecoilValue } from 'recoil';
import { ThemeStyle, ThemeType, baseTheme, darkTheme, themeStyleState } from '../../state/theme';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { useNetwork } from '../network/useNetwork';

export function useTheme(): ThemeType {
    const style = useRecoilValue(themeStyleState);
    const { isTestnet } = useNetwork();
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
            accent: isTestnet ? '#F3A203' : '#47A9F1',
            accentDark: isTestnet ? '#F3A203' : '#288FD8',
            accentText: isTestnet ? '#E99A02' : '#1C8FE3',
        };
    }, [isTestnet, themeStyle]);

    return theme;
}