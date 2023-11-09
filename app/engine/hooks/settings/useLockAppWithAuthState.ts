import { useRecoilState } from "recoil";
import { lockAppWithAuthState } from "../../state/lockAppWithAuthState";

export function useLockAppWithAuthState() {
    return useRecoilState(lockAppWithAuthState);
}