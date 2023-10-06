import { queryClient } from "../../clients";
import { DomainSubkey } from "../../legacy/products/ExtensionsProduct";
import { Queries } from "../../queries";
import { useDomainKeys } from "./useDomainKeys";

export function useDomainKey(domain: string) {
    const keys = useDomainKeys();
    return keys[domain] as DomainSubkey | undefined;
}