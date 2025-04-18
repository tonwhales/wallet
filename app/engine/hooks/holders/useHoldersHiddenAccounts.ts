import { Address } from "@ton/core";
import { useHoldersAccounts } from ".";
import { useRecoilState } from "recoil";
import { hiddenCardsState } from "../../state/holders";

export function useHoldersHiddenAccounts(address: string | Address, solanaAddress?: string): [string[], (cardId: string, hidden: boolean) => void] {
    const accounts = useHoldersAccounts(address, solanaAddress).data?.accounts;
    const [hiddenState, update] = useRecoilState(hiddenCardsState);

    const markAccount = (accountId: string, hidden: boolean) => {
        if (hidden) {
            update([...hiddenState, accountId]);
        } else {
            update(hiddenState.filter((c) => c !== accountId));
        }
    };

    return [
        hiddenState.filter((card) => accounts?.find((c) => c.id === card)),
        markAccount
    ];
}