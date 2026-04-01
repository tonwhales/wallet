import { Address } from "@ton/core";
import { useHoldersAccounts } from ".";
import { useRecoilState } from "recoil";
import { hiddenPrepaidCardsState } from "../../state/holders";

export function useHoldersHiddenPrepaidCards(address: string | Address, solanaAddress?: string, ethereumAddress?: string): [string[], (cardId: string, hidden: boolean) => void] {
    const cards = useHoldersAccounts(address, solanaAddress, ethereumAddress).data?.prepaidCards;
    const [hiddenState, update] = useRecoilState(hiddenPrepaidCardsState);

    const markAccount = (accountId: string, hidden: boolean) => {
        if (hidden) {
            update([...hiddenState, accountId]);
        } else {
            update(hiddenState.filter((c) => c !== accountId));
        }
    };

    return [
        hiddenState.filter((card) => cards?.find((c) => c.id === card)),
        markAccount
    ];
}