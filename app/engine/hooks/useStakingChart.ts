import { Address } from '@ton/core';
import { useNetwork } from './useNetwork';
import { useClient4 } from './useClient4';
import { useSelectedAccount } from './useSelectedAccount';
import { useStakingPoolMemberMonthlyChart } from './staking/useStakingPoolMemberMonthlyChart';

export function useStakingChart(target: Address) {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let selected = useSelectedAccount().address;
    
    return useStakingPoolMemberMonthlyChart(client, target, selected);
}