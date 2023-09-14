import { useQuery } from '@tanstack/react-query';
import BN from 'bn.js';
import { Queries } from '../queries';
import { getLastBlock } from '../accountWatcher';
import { useClient4 } from './useClient4';
import { useNetwork } from './useNetwork';
import { Address } from 'ton';
import { useMemo } from 'react';

type AccountLite = {
    address: string,
    balance: BN,
}

export function useAccountLite(address: string | Address): AccountLite | null {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);

    let addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toFriendly({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    let query = useQuery({
        queryKey: Queries.Account(addressString).Lite(),
        queryFn: async (key) => {
            let addr = key.queryKey[1];
            let last = await getLastBlock();
            return await client.getAccountLite(last, Address.parse(addr));
        },
    });

    if (!query.data?.account?.balance) {
        return null;
    }

    return {
        address: addressString,
        balance: query.data.account.balance.coins ? new BN(query.data?.account.balance.coins) : new BN(0),
    }
}