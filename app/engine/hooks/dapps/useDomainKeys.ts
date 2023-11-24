import { useRecoilState } from "recoil";
import { DomainKeysState, domainKeys } from "../../state/domainKeys";

export function useDomainKeys(): [DomainKeysState, (value: DomainKeysState) => void] {
    const [value, update] = useRecoilState(domainKeys);
    return [(value || {}), update];
}