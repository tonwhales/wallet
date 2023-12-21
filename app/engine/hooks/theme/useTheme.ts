import { ThemeType } from '../../state/theme';
import { useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';

export function useTheme(): ThemeType {
    return useContext(ThemeContext);
}