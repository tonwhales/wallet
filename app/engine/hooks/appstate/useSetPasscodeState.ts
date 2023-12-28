import { useSetRecoilState } from "recoil";
import { passcodeState } from "../../state/biometricsAndPasscode";

export function useSetPasscodeState() {
    return useSetRecoilState(passcodeState);
}