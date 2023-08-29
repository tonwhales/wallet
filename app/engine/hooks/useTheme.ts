import { useRecoilValue } from 'recoil';
import { themeSelector } from '../state/theme';

export function useTheme() {
    return useRecoilValue(themeSelector);
}