import { useMemo } from "react";
import { atomFamily, useRecoilState } from "recoil";
import { storagePersistence } from "../../../storage/storage";
import { z } from "zod";

const sortedHintsKey = 'sortedHints';
const weightedHintsCodec = z.record(z.number());
export type WeightedHints = z.infer<typeof weightedHintsCodec>;

function getSortedHints(address?: string): { [key: string]: number } {
    if (!address) {
        return {};
    }

    const stored = storagePersistence.getString(`${sortedHintsKey}/${address.toString()}`);
    if (!stored) {
        return {};
    }

    const parsed = weightedHintsCodec.safeParse(JSON.parse(stored));
    if (parsed.success) {
        return parsed.data;
    }

    return {};
}

function storeSortedHints(address: string, state: WeightedHints) {
    storagePersistence.set(`${sortedHintsKey}/${address.toString()}`, JSON.stringify(state));
}

export const sortedHintsAtomFamily = atomFamily<WeightedHints, string>({
    key: 'wallet/hints/sorted/family',
    default: (address) => getSortedHints(address),
    effects: (address) => [
        ({ setSelf, onSet }) => {
            const stored = getSortedHints(address);
            setSelf(stored);

            onSet((newValue, _, isReset) => {
                if (isReset) {
                    storeSortedHints(address, {});
                    return;
                }

                storeSortedHints(address, newValue);
            });
        }
    ]
});

export function useSortedHintsMap(address?: string) {
    return useRecoilState(sortedHintsAtomFamily(address ?? ''));
}

export function useSortedHints(address?: string) {
    const [map,] = useSortedHintsMap(address);

    return useMemo(() => {
        return Object.entries(map).sort((a, b) => {
            if (a[1] === b[1]) {
                return 0;
            }

            return a[1] > b[1] ? -1 : 1;
        })
            // filter out negative weights (no jetton wallet found)
            .filter(([, wieght]) => wieght >= 0)
            .map(([hint]) => hint);
    }, [map]);
}