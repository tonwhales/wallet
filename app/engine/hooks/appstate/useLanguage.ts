import { useRecoilState } from "recoil";
import { languageState } from "../../state/language";

export function useLanguage(): [string, (value: string) => void] {
    return useRecoilState(languageState);
}