import { Address } from '@ton/core';
import { useFilteredHints } from './useFilteredHints';
import { useJettonContents } from './useJettonContents';
import { useJettonWallets } from './useJettonWallets';
import { Jetton } from '../../types';
import { useCloudValue } from '../cloud';

export function useJettons(owner: string): Jetton[] {
    let hints = useFilteredHints(owner, (a) => !!a.jettonWallet && a.jettonWallet?.owner === owner && !!a.jettonWallet.master);
    let masterContents = useJettonContents(hints.map(a => a.jettonWallet!.master));
    let actualBalances = useJettonWallets(hints.map(a => a.address));
    let [disabledState,] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

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
                disabled: !!disabledState.disabled[a.jettonWallet!.master],
            };
        });

    return jettons;
}