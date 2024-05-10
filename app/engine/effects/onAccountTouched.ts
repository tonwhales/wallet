import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';

export async function onAccountsTouched(accounts: Set<string>) {
    queryClient.invalidateQueries({
        predicate: (query) => {
            const queryKey = query.queryKey as string[];
            if (queryKey[0] === 'account') {
                return accounts.has(queryKey[1]);
            } else if (queryKey[0] === 'transactions') {
                return accounts.has(queryKey[1]);
            } else if (queryKey[0] === 'staking' && queryKey[1] === 'member') {
                return accounts.has(queryKey[3]);
            } else if (queryKey[0] === 'staking' && queryKey[1] === 'member' && queryKey[2] === 'liquid') {
                return accounts.has(queryKey[4]);
            }
            return false;
        },
    })
}

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toString({ testOnly: isTestnet });

    queryClient.invalidateQueries(Queries.Account(address).All());
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