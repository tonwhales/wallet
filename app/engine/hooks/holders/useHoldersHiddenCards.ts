import { Address } from "@ton/core";
import { useHoldersCards } from ".";
import { useRecoilState } from "recoil";
import { hiddenCardsState } from "../../state/holders";

export function useHoldersHiddenCards(address: string | Address): [string[], (cardId: string, hidden: boolean) => void] {
    const cards = useHoldersCards(address).data;
    const [hiddenState, update] = useRecoilState(hiddenCardsState);

    const markCard = (cardId: string, hidden: boolean) => {
        if (hidden) {
            update([...hiddenState, cardId]);
        } else {
            update(hiddenState.filter((c) => c !== cardId));
        }
    };

    return [
        hiddenState.filter((card) => !cards?.find((c) => c.id === card)),
        markCard
    ];
}