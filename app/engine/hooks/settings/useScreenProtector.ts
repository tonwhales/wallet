import { useRecoilState } from "recoil";
import { screenProtectorState } from "../../state/screenProtector";

export function useScreenProtectorState() {
    return useRecoilState(screenProtectorState);
}