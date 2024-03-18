import { useRecoilState } from "recoil";
import { bounceableWalletFormatAtom } from "../../state/bounceableWalletFormat";

export function useBounceableWalletFormat(): [boolean, (valOrUpdater: ((currVal: boolean) => boolean) | boolean) => void] {
    return useRecoilState(bounceableWalletFormatAtom);
}