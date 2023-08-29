import { useRecoilValue } from 'recoil';
import { navigationThemeSelector } from '../state/theme';

export function useNavigationTheme() {
    return useRecoilValue(navigationThemeSelector);
}