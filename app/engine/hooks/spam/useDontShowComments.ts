import { useRecoilState } from "recoil";
import { dontShowCommentsState } from "../../state/spam";

export function useDontShowComments(): [boolean, (valOrUpdater: ((currVal: boolean) => boolean) | boolean) => void] {
    return useRecoilState(dontShowCommentsState);
}