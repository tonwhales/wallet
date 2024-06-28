import { Address } from "@ton/core";
import { useHoldersAccounts } from "..";

export function useHasHoldersProducts(address?: string | Address) {
    const accs = useHoldersAccounts(address).data;

    if (!accs) {
        return false;
    }

    const accounts = accs.accounts.length;
    const cards = accs?.prepaidCards?.length || 0;

    return accounts + cards > 0;
}