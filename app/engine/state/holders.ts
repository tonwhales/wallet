import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";

const hiddenCardsKey = 'hiddenCards';

function getStoredHiddenCards(): string[] {
    const stored = storagePersistence.getString(hiddenCardsKey);
    if (!!stored) {
        return JSON.parse(stored) as string[];
    }
    return [];
}

function storeHiddenCards(value: string[]) {
    storagePersistence.set(hiddenCardsKey, JSON.stringify([...new Set(value)]));
}

export const hiddenCardsState = atom<string[]>({
    key: 'holders/hiddenCards',
    default: getStoredHiddenCards(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeHiddenCards(newValue);
        })
    }]
});