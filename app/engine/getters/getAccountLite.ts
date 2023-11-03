import { Address } from "@ton/core";
import { queryClient } from "../clients";
import { Queries } from "../queries";
import { AccountLite } from "../hooks/accounts/useAccountLite";

export function getAccountLite(address: string | Address) {
    const addressString = address instanceof Address ? address.toString() : address;
    return queryClient.getQueryData<AccountLite | null>(Queries.Account(addressString).Lite());
}