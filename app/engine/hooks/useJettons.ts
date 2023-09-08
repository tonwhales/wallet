import { Address } from 'ton';
import { useHints } from './basic/useHints';
import { useQueries } from '@tanstack/react-query';
import { Queries } from '../queries';
import { useNetwork } from './useNetwork';
import { fetchMetadata } from '../metadata/fetchMetadata';
import { useClient4 } from './useClient4';
import { hintsMetadataQueryFn } from './usePrefetchHints';
import BN from 'bn.js';
import { useFilteredHints } from './basic/useFilteredHints';
import { useJettonContents } from './basic/useJettonContents';

type PreparedJetton = {
    master: Address;
    wallet: Address;
    name: string;
    description: string;
    symbol: string;
    balance: BN;
    icon: string | null;
    decimals: number | null;
};

export function useJettons(owner: string): PreparedJetton[] {
    let hints = useFilteredHints(owner, (a) => !!a.jettonWallet && a.jettonWallet?.owner === owner && !!a.jettonWallet.master);
    let masterContents = useJettonContents(hints.map(a => a.jettonWallet!.master));

    let jettons: PreparedJetton[] = hints
        .filter(a => !!masterContents.find(b => a.jettonWallet?.master === b.data?.address))
        .map<PreparedJetton>(a => {
            let content = masterContents.find(b => a.jettonWallet?.master === b.data?.address)!.data!;
            return {
                balance: new BN(a.jettonWallet!.balance),
                wallet: Address.parse(a.address),
                master: Address.parse(a.jettonWallet!.master),
                name: content.name ?? '',
                symbol: content.symbol ?? '',
                description: content.description ?? '',
                decimals: content.decimals ?? null,
                icon: content.originalImage ?? null,
            };
        });

    return jettons;
}