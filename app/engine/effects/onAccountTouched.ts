import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { InfiniteData } from '@tanstack/react-query';
import { StoredTransaction } from '../types';

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toString({ testOnly: isTestnet });
    await queryClient.invalidateQueries(Queries.Account(address).All());

    queryClient.setQueryData(Queries.Transactions(address), (old: InfiniteData<StoredTransaction[]> | undefined) => {
        if (!old) {
            return old;
        }

        return {
            pageParams: old.pageParams,
            pages: [old.pages[0]],
        };
    });


    await queryClient.refetchQueries({
        queryKey: Queries.Transactions(address),
        refetchPage: (last, index) => index == 0,
    });
}