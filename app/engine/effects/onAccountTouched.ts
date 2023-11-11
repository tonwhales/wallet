import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { InfiniteData } from '@tanstack/react-query';
import { StoredTransaction } from '../types';

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toString({ testOnly: isTestnet });
    await queryClient.invalidateQueries(Queries.Account(address).All());

    await queryClient.invalidateQueries({
        queryKey: Queries.Transactions(address),
        refetchPage: (last, index, allPages) => index == 0,
    });
}