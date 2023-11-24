import { useRecoilValue } from "recoil";
import { appStateAtom } from "../../state/appState";

export function useAppState() {
    return useRecoilValue(appStateAtom);
}