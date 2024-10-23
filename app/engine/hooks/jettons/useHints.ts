import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHints } from '../../api/fetchHints';
import { z } from "zod";
import { storagePersistence } from '../../../storage/storage';
import { fetchMintlessHints, MintlessJetton } from '../../api/fetchMintlessHints';
import { queryClient } from '../../clients';
import { StoredJettonWallet } from '../../metadata/StoredMetadata';
import { getQueryData } from '../../utils/getQueryData';

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
        refetchInterval: 15_000,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    return hints.data || [];
}

export function useMintlessHints(addressString?: string): MintlessJetton[] {
    let hints = useQuery({
        queryKey: Queries.Mintless(addressString || ''),
        queryFn: async () => {
            try {
                const fetched = await fetchMintlessHints(addressString!);

                const cache = queryClient.getQueryCache();
                // update jetton wallets with mintless hints
                fetched?.forEach(hint => {
                    const wallet = getQueryData<StoredJettonWallet | null>(cache, Queries.Account(hint.walletAddress.address).JettonWallet());

                    if (!wallet) {
                        queryClient.setQueryData<StoredJettonWallet | null>(Queries.Account(hint.walletAddress.address).JettonWallet(), {
                            balance: hint.balance,
                            owner: addressString!,
                            master: hint.jetton.address,
                            address: hint.walletAddress.address
                        });
                    }
                });

                return fetched;
            } catch (e) {
                console.warn('fetch mintless hints error', e);
            }
        },
        enabled: !!addressString,
        refetchInterval: 15_000,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    return hints.data || [];
}