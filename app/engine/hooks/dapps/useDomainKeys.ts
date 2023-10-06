import { useRecoilValue } from "recoil";
import { domainKeys } from "../../state/domainKeys";

export function useDomainKeys() {
    const value = useRecoilValue(domainKeys);
    return value || {};
}