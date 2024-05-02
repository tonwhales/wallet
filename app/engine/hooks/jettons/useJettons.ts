import { Address } from '@ton/core';
import { useFilteredHints } from './useFilteredHints';
import { useJettonContents } from './useJettonContents';
import { useJettonWallets } from './useJettonWallets';
import { Jetton } from '../../types';
import { useCloudValue } from '../cloud';
import { t } from '../../../i18n/t';

export function useJettons(owner: string): Jetton[] {
    // TODO sync jetton wallet
    let hints = useFilteredHints(owner, (a) => !!a.jettonWallet && a.jettonWallet?.owner === owner && !!a.jettonWallet.master);
    let masterContents = useJettonContents(hints.map(a => a.jettonWallet!.master));
    let actualBalances = useJettonWallets(hints.map(a => a.address));
    let [disabledState,] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    let jettons: Jetton[] = hints
        .filter(a => !!masterContents.find(b => a.jettonWallet?.master === b.data?.address))
        .map<Jetton>(a => {
            let content = masterContents.find(b => a.jettonWallet?.master === b.data?.address)!.data!;
            let balance = actualBalances.find(b => a.address === b.data?.address)?.data?.balance ?? a.jettonWallet!.balance;

            let name = content.name ?? '';
            let symbol = content.symbol ?? '';
            let description = content.description ?? '';

            if (content.assets) {
                const asset0Symbol = content.assets[0].type === 'native' ? 'TON' : content.assets[0].metadata.symbol;
                const asset1Symbol = content.assets[1].type === 'native' ? 'TON' : content.assets[1].metadata.symbol;

                const asset0Name = content.assets[0].type === 'native' ? 'TON' : content.assets[0].metadata.name;
                const asset1Name = content.assets[1].type === 'native' ? 'TON' : content.assets[1].metadata.name;

                name = `LP ${asset0Name}-${asset1Name}`;
                symbol = ` ${asset0Symbol}-${asset1Symbol} LP`;

                if (content.pool === 'dedust') {
                    description = t('jetton.liquidPoolDescriptionDedust', { name0: asset0Name, name1: asset1Name });
                } else if (content.pool === 'ston-fi') {
                    description = t('jetton.liquidPoolDescriptionStonFi', { name0: asset0Name, name1: asset1Name });
                }
            }

            return {
                balance: BigInt(balance),
                wallet: Address.parse(a.address),
                master: Address.parse(a.jettonWallet!.master),
                name,
                symbol,
                description,
                decimals: content.decimals ?? null,
                icon: content.image?.preview256 ?? null,
                disabled: !!disabledState.disabled[a.jettonWallet!.master],
                assets: !!content.assets ? [content.assets[0], content.assets[1]] : null,
                pool: content.pool,
            };
        });

    return jettons;
}