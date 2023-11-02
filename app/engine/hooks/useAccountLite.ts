import { useQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { getLastBlock } from '../accountWatcher';
import { useClient4 } from './useClient4';
import { useNetwork } from './useNetwork';
import { Address } from '@ton/core';
import { useMemo } from 'react';

export type AccountLite = {
    address: string,
    balance: bigint,
}

export function useAccountLite(address?: Address | null): AccountLite | null {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);

    let addressString = useMemo(() => {
        if (!address) {
            return '';
        }
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return '';
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
        balance: query.data.account.balance.coins ? BigInt(query.data?.account.balance.coins) : BigInt(0),
    }
}