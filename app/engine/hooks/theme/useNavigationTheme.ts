import { useEffect } from 'react';
import { changeNavBarColor } from '../../../components/modules/NavBar';
import { ThemeStyle } from '../../state/theme';
import { useTheme } from './useTheme';
import { DefaultTheme } from '@react-navigation/native';
import { Theme as NavigationThemeType } from '@react-navigation/native';

export function useNavigationTheme(): NavigationThemeType {
    const theme = useTheme();

    useEffect(() => {
        changeNavBarColor(theme.surfaceOnBg);
    }, [theme]);

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