import { Address } from '@ton/core';
import { useNetwork } from '../useNetwork';
import { useClient4 } from '../useClient4';
import { useStakingPoolMemberMonthlyChart } from './useStakingPoolMemberMonthlyChart';

export function useStakingChart(pool: Address, member: Address) {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    
    return useStakingPoolMemberMonthlyChart(client, pool, member);
}