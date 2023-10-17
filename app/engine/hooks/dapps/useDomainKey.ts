import { DomainSubkey } from "../../legacy/products/ExtensionsProduct";
import { useDomainKeys } from "./useDomainKeys";

export function useDomainKey(domain: string) {
    const [keys,] = useDomainKeys();
    return keys[domain] as DomainSubkey | undefined;
}