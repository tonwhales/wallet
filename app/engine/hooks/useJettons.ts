import { Address } from '@ton/core';
import { useFilteredHints } from './basic/useFilteredHints';
import { useJettonContents } from './basic/useJettonContents';
import { useJettonWallets } from './basic/useJettonWallets';

export type Jetton = {
    master: Address;
    wallet: Address;
    name: string;
    description: string;
    symbol: string;
    balance: bigint;
    icon: string | null;
    decimals: number | null;
};

export function useJettons(owner: string): Jetton[] {
    let hints = useFilteredHints(owner, (a) => !!a.jettonWallet && a.jettonWallet?.owner === owner && !!a.jettonWallet.master);
    let masterContents = useJettonContents(hints.map(a => a.jettonWallet!.master));
    let actualBalances = useJettonWallets(hints.map(a => a.address));

    let jettons: Jetton[] = hints
        .filter(a => !!masterContents.find(b => a.jettonWallet?.master === b.data?.address))
        .map<Jetton>(a => {
            let content = masterContents.find(b => a.jettonWallet?.master === b.data?.address)!.data!;
            let balance = actualBalances.find(b => a.address === b.data?.address)?.data?.balance ?? a.jettonWallet!.balance;
            
            return {
                balance: BigInt(balance),
                wallet: Address.parse(a.address),
                master: Address.parse(a.jettonWallet!.master),
                name: content.name ?? '',
                symbol: content.symbol ?? '',
                description: content.description ?? '',
                decimals: content.decimals ?? null,
                icon: content.image?.preview256 ?? null,
            };
        });

    return jettons;
}