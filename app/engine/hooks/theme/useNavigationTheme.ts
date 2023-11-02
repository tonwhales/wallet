import { ThemeStyle } from '../../state/theme';
import { useTheme } from './useTheme';
import { DefaultTheme } from '@react-navigation/native';

export function useNavigationTheme() {
    const theme = useTheme();

    return {
        dark: theme.style === ThemeStyle.Dark,
        colors: {
            ...DefaultTheme.colors,
            primary: theme.accent,
            background: theme.background,
            card: theme.background
        }
    }
}