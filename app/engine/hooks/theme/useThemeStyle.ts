import { useRecoilValue, useSetRecoilState } from "recoil";
import { ThemeStyle, themeStyleState } from "../../state/theme";

export function useThemeStyle(): [ThemeStyle, (value: ThemeStyle) => void] {
    const value = useRecoilValue(themeStyleState);
    const update = useSetRecoilState(themeStyleState);
    return [value, update];
}