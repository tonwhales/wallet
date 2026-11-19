import * as Application from 'expo-application';
import { useEffect, useMemo, useReducer } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { whalesConnectEndpoint } from '../../clients';
import { useNetwork } from '../network';
import { useSelectedAccount } from '../appstate';
import { useSolanaSelectedAccount } from '../solana/useSolanaSelectedAccount';
import { fetchFlags } from '../../api/fetchFlags';
import { FlagsSnapshot, msUntilFlagsExpire } from '../../flags/resolveFlagValue';

const DEFAULT_TTL_SECONDS = 60;
const STALE_TIME_MS = 30 * 1000;

export function useFlagsSnapshot(): FlagsSnapshot | null {
    const { isTestnet } = useNetwork();
    const account = useSelectedAccount();
    const solanaAddress = useSolanaSelectedAccount();
    const network = isTestnet ? 'testnet' : 'mainnet';
    const appVersion = Application.nativeApplicationVersion ?? '';
    const tonAddress = account?.address.toRawString();
    const addresses = [tonAddress, solanaAddress].filter((address): address is string => !!address);
    const [expirations, expire] = useReducer((count: number) => count + 1, 0);

    const query = useQuery({
        queryKey: Queries.Flags(network, addresses, appVersion, whalesConnectEndpoint),
        queryFn: () => fetchFlags({
            network,
            addresses,
            appVersion: appVersion || undefined,
            platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
        }),
        enabled: addresses.length > 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: STALE_TIME_MS,
        refetchInterval: (data) => (data?.ttl ?? DEFAULT_TTL_SECONDS) * 1000
    });

    const { data, dataUpdatedAt } = query;

    useEffect(() => {
        if (!data) {
            return;
        }
        const left = msUntilFlagsExpire(dataUpdatedAt, Date.now());
        if (left <= 0) {
            return;
        }
        const timer = setTimeout(expire, left);
        return () => clearTimeout(timer);
    }, [data, dataUpdatedAt]);

    return useMemo(() => {
        if (!data || msUntilFlagsExpire(dataUpdatedAt, Date.now()) <= 0) {
            return null;
        }
        return { flags: data.flags, updatedAt: dataUpdatedAt };
    }, [data, dataUpdatedAt, expirations]);
}
