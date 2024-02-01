import { useRecoilState } from "recoil";
import { notBounceableWalletFormatAtom } from "../../state/notBounceableWalletFormat";

export function useNotBounceableWalletFormat(): [boolean, (newValue: boolean) => void] {
    return useRecoilState(notBounceableWalletFormatAtom);
}