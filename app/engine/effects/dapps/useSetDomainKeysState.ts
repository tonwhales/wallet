import { useRecoilCallback } from "recoil";
import { DomainKeysState, domainKeys } from "../../state/domainKeys";

export function useSetDomainKeysState() {
    return useRecoilCallback(({ set }) => (value: DomainKeysState) => {
        set(domainKeys, () => value);
    }, []);
}