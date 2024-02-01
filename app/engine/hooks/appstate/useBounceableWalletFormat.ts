import { useRecoilState } from "recoil";
import { bounceableWalletFormatAtom } from "../../state/bounceableWalletFormat";

export function useBounceableWalletFormat(): [boolean, (newValue: boolean) => void] {
    return useRecoilState(bounceableWalletFormatAtom);
}