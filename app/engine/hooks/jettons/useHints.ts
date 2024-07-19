import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHints } from '../../api/fetchHints';
import { z } from "zod";
import { storagePersistence } from '../../../storage/storage';

const txsHintsKey = 'txsHints';
const txsHintsCodec = z.array(z.string());

function getTxsHints(owner: string): string[] {
    const hints = storagePersistence.getString(`${txsHintsKey}/${owner}`);
    if (!hints) {
        return [];
    }

    const parsed = txsHintsCodec.safeParse(JSON.parse(hints));
    if (!parsed.success) {
        return [];
    }

    return parsed.data;
}

export function addTxHints(owner: string, txHints: string[]) {
    const hints = new Set([...getTxsHints(owner), ...txHints]);
    storeTxsHints(owner, Array.from(hints));
}

function storeTxsHints(owner: string, hints: string[]) {
    storagePersistence.set(`${txsHintsKey}/${owner}`, JSON.stringify(hints));
}

export function useHints(addressString?: string): string[] {
    let hints = useQuery({
        queryKey: Queries.Hints(addressString || ''),
        queryFn: async () => {
            const fetched = (await fetchHints(addressString!)).hints;

            // merge with txs hints (to negate high hints worker lag)
            const txsHints = getTxsHints(addressString || '');
            const hints = new Set([...fetched, ...txsHints]);

            return Array.from(hints);
        },
        enabled: !!addressString,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    });

    return hints.data || [];
}