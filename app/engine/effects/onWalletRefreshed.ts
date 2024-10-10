import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';


export async function onWalletRefreshed(account: string, wallet: string, isTestnet: boolean) {
    let address = Address.parse(account).toString({ testOnly: isTestnet });

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