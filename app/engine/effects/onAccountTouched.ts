import { Address } from 'ton';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { InfiniteData } from '@tanstack/react-query';
import { StoredTransaction } from '../hooks/useRawAccountTransactions';

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toFriendly({ testOnly: isTestnet });
    await queryClient.invalidateQueries(Queries.Account(address).All());

    await queryClient.refetchQueries({
        queryKey: Queries.Account(address).Transactions(),
        refetchPage: (last, index) => index == 0,
    });
    queryClient.setQueryData(Queries.Account(address).Transactions(), (old: InfiniteData<StoredTransaction[]> | undefined) => {
        if (!old) {
            return old;
        }

        console.warn('old', old);

        return {
            pageParams: old.pageParams,
            pages: [old.pages[0]],
        };
    });
}