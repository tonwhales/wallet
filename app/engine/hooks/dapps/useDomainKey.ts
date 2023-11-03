import { DomainSubkey } from "../../state/domainKeys";
import { useDomainKeys } from "./useDomainKeys";

export function useDomainKey(domain: string) {
    const [keys,] = useDomainKeys();
    return keys[domain] as DomainSubkey | undefined;
}