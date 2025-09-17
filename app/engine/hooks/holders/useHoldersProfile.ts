import { useQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useMemo } from 'react';
import { fetchUserProfile } from '../../api/holders/fetchUserProfile';
import { HoldersUserState } from '../../api/holders/fetchUserState';
import { Queries } from '../../queries';
import { useNetwork } from '../network/useNetwork';
import { useHoldersAccountStatus } from './useHoldersAccountStatus';

export function useHoldersProfile(address: string | Address | undefined) {
	const { isTestnet } = useNetwork();

	const addressString = useMemo(() => {
		if (address instanceof Address) {
			return address.toString({ testOnly: isTestnet });
		}
		return address;
	}, [address, isTestnet]);

	const { data: accountStatus } = useHoldersAccountStatus(address);
	const token =
		accountStatus && accountStatus?.state !== HoldersUserState.NeedEnrollment
			? accountStatus.token
			: undefined;

	return useQuery({
		queryKey: Queries.Holders(addressString || 'default').Profile(),
		queryFn: async () => {
			if (!token) {
				return null;
			}
			return await fetchUserProfile(token, isTestnet);
		},
		enabled: !!token,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		refetchInterval: 1000 * 30,
		staleTime: 1000 * 5
	});
}
