import { useEffect } from 'react';
import { changeNavBarColor } from '../../../components/modules/NavBar';
import { ThemeStyle } from '../../state/theme';
import { useTheme } from './useTheme';
import { DefaultTheme } from '@react-navigation/native';
import { Theme as NavigationThemeType } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import { useThemeStyle } from './useThemeStyle';
import { Platform } from 'react-native';

export function useNavigationTheme(): NavigationThemeType {
    const theme = useTheme();
    const [themeStyle,] = useThemeStyle();

    useEffect(() => {
        changeNavBarColor(theme.surfaceOnBg);
        if (themeStyle !== ThemeStyle.System && Platform.OS === 'android') {
            SystemUI.setBackgroundColorAsync(theme.backgroundPrimary);
        } else {
            SystemUI.setBackgroundColorAsync(null);
        }
    }, [theme, themeStyle]);

    return {
        dark: theme.style === ThemeStyle.Dark,
        colors: {
            ...DefaultTheme.colors,
            primary: theme.accent,
            background: theme.backgroundPrimary,
            border: theme.border,
            card: theme.backgroundPrimary
        }
    }
}