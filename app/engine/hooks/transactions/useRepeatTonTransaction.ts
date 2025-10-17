import { useCallback } from 'react';
import { Address } from '@ton/core';
import { TonTransaction } from '../../types';
import { useNetwork } from '../network/useNetwork';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { queryClient } from '../../clients';
import { getQueryData } from '../../utils/getQueryData';
import { Queries } from '../../queries';
import { StoredJettonWallet } from '../../metadata/StoredMetadata';
import { jettonWalletQueryFn } from '../jettons/jettonsBatcher';
import { warn } from '../../../utils/log';

/**
 * Hook for repeating TON transaction
 * @returns function to repeat transaction
 */
export function useRepeatTonTransaction() {
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();

    return useCallback(async (tx: TonTransaction, formattedAddressString: string) => {
        const amount = BigInt(tx.base.parsed.amount);
        const operation = tx.base.operation;
        let item = operation.items[0];
        let opAddressString = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;

        let jetton: Address | undefined = undefined;

        if (item.kind === 'token') {
            const queryCache = queryClient.getQueryCache();
            const jettonWallet = getQueryData<StoredJettonWallet | null | undefined>(
                queryCache,
                Queries.Account(opAddressString).JettonWallet()
            );

            if (jettonWallet) {
                jetton = Address.parse(jettonWallet.master);
            } else {
                try {
                    const res = await queryClient.fetchQuery({
                        queryKey: Queries.Account(opAddressString).JettonWallet(),
                        queryFn: jettonWalletQueryFn(opAddressString, isTestnet)
                    });

                    if (res) {
                        jetton = Address.parse(res.master);
                    }
                } catch {
                    warn('Failed to fetch jetton wallet');
                }
            }

            // If jettonWallet is not found (for example, swap on DEX), use TON from items[1]
            if (!jetton && operation.items.length > 1 && operation.items[1].kind === 'ton') {
                item = operation.items[1];
                opAddressString = tx.base.parsed.resolvedAddress;
            }
        }

        navigation.navigateSimpleTransfer({
            target: formattedAddressString,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: amount < 0n ? -amount : amount,
            stateInit: null,
            asset: { type: 'jetton', master: jetton },
            callback: null
        });
    }, [navigation, isTestnet]);
}

