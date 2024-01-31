import { useRecoilState } from "recoil";
import { newAddressFormatAtom } from "../../state/newAddressFormat";

export function useNewAddressFormat(): [boolean, (useNewAddressFormat: boolean) => void] {
    return useRecoilState(newAddressFormatAtom);
}