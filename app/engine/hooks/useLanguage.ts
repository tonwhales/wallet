import { useRecoilValue, useSetRecoilState } from "recoil";
import { languageState } from "../state/language";

export function useLanguage(): [string, (value: string) => void] {
    const value = useRecoilValue(languageState);
    const update = useSetRecoilState(languageState);

    return [value, update]
}