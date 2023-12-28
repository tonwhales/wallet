import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toString({ testOnly: isTestnet });
    
    queryClient.invalidateQueries(Queries.Account(address).All());
    queryClient.invalidateQueries({
        queryKey: Queries.Transactions(address),
        refetchPage: (last, index, allPages) => index == 0,
    });
}