import { atomFamily, useRecoilState, useRecoilValue } from "recoil";
import { storagePersistence } from "../../../storage/storage";
import { z } from "zod";

const sortedHintsKey = 'sortedHints';
const weightedHintsCodec = z.array(z.string());

export function getSortedHints(address?: string): string[] {
    if (!address) {
        return [];
    }

    const stored = storagePersistence.getString(`${sortedHintsKey}/${address.toString()}`);
    if (!stored) {
        return [];
    }

    const parsed = weightedHintsCodec.safeParse(JSON.parse(stored));
    if (parsed.success) {
        return parsed.data;
    }

    return [];
}

function storeSortedHints(address: string, state: string[]) {
    storagePersistence.set(`${sortedHintsKey}/${address.toString()}`, JSON.stringify(state));
}

export const sortedHintsAtomFamily = atomFamily<string[], string>({
    key: 'wallet/hints/sorted/family',
    effects: (address) => [
        ({ onSet, setSelf }) => {
            setSelf(getSortedHints(address));
            onSet((newValue, _, isReset) => {
                if (isReset) {
                    storeSortedHints(address, []);
                    return;
                }

                storeSortedHints(address, newValue);
            });
        }
    ]
});

export function useSortedHintsState(address?: string) {
    return useRecoilState(sortedHintsAtomFamily(address ?? ''));
}

export function useSortedHints(address?: string) {
    return useRecoilValue(sortedHintsAtomFamily(address ?? ''));
}