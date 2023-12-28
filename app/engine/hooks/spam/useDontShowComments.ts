import { useRecoilValue, useSetRecoilState } from "recoil";
import { dontShowCommentsState } from "../../state/spam";

export function useDontShowComments(): [boolean, (value: boolean) => void] {
    const value = useRecoilValue(dontShowCommentsState);
    const update = useSetRecoilState(dontShowCommentsState);

    return [value, update];
}