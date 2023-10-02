import { useRecoilCallback } from "recoil";
import { passcodeState } from "../state/biometricsAndPasscode";
import { PasscodeState } from "../../storage/secureStorage";

export function useSetPasscodeState() {
    return useRecoilCallback(({ set }) => (value: PasscodeState) => {
        set(passcodeState, () => value);
    }, []);
}