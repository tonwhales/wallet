import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { getQueryData } from '../utils/getQueryData';
import { JettonFull } from '../api/fetchHintsFull';

export async function onAccountsTouched(accounts: Set<string>) {
    const cache = queryClient.getQueryCache();
    queryClient.invalidateQueries({
        predicate: (query) => {
            const queryKey = query.queryKey as string[];
            if (queryKey[0] === 'account') {
                const isAccountInQuery = accounts.has(queryKey[1]);

                if (!isAccountInQuery) {
                    return false;
                }

                return true;
            } else if (queryKey[0] === 'transactions') {
                return accounts.has(queryKey[1]);
            } else if (queryKey[0] === 'staking' && queryKey[1] === 'member') {
                return accounts.has(queryKey[3]);
            } else if (queryKey[0] === 'staking' && queryKey[1] === 'member' && queryKey[2] === 'liquid') {
                return accounts.has(queryKey[4]);
            } else if (queryKey[0] === 'jettons' && queryKey[1] === 'address' && queryKey[3] === 'master' && queryKey[5] === 'transactions') {
                if (accounts.has(queryKey[2])) {
                    queryClient.invalidateQueries({
                        queryKey: queryKey,
                        refetchPage: (last, index, allPages) => index == 0,
                    });
                }
            } else if (queryKey[0] === 'jettons' && queryKey[1] === 'full') {
                const cached = getQueryData<JettonFull[]>(cache, queryKey);
                if (cached) {
                    for (const hint of cached) {
                        if (accounts.has(hint.jetton.address)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
    })
}

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toString({ testOnly: isTestnet });

    queryClient.invalidateQueries(Queries.Account(address).All());
    queryClient.invalidateQueries(Queries.HintsFull(address));
    queryClient.invalidateQueries({
        queryKey: Queries.Transactions(address),
        refetchPage: (last, index, allPages) => index == 0,
    });
    queryClient.invalidateQueries({
        predicate: (query) => {
            const queryKey = query.queryKey as string[];
            if (queryKey[0] === 'staking' && queryKey[1] === 'member') {
                return queryKey[3] === address;
            } else if (queryKey[0] === 'staking' && queryKey[1] === 'member' && queryKey[2] === 'liquid') {
                return queryKey[4] === address;
            }
            return false;
        }
    });
}