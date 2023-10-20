import { useRecoilValue, useSetRecoilState } from "recoil";
import { DomainKeysState, domainKeys } from "../../state/domainKeys";

export function useDomainKeys(): [DomainKeysState, (value: DomainKeysState) => void] {
    const value = useRecoilValue(domainKeys);
    const update = useSetRecoilState(domainKeys);
    return [(value || {}), update];
}