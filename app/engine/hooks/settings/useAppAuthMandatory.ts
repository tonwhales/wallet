import { useRecoilState } from "recoil";
import { lockAppWithAuthMandatoryState } from "../../state/lockAppWithAuthState";

export function useAppAuthMandatory() {
    return useRecoilState(lockAppWithAuthMandatoryState);
}