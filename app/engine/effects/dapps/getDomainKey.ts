import { queryClient } from "../../clients";
import { DomainSubkey } from "../../legacy/products/ExtensionsProduct";
import { Queries } from "../../queries";

export function getDomainKey(domain: string) {
    return queryClient.getQueryData<DomainSubkey>(Queries.Domains(domain).Key());
}