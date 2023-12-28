import { Address } from '@ton/core';
import { useStakingPoolParams } from './useStakingPoolParams';
import { useSelectedAccount } from '../appstate/useSelectedAccount';
import { useNetwork } from '../network/useNetwork';
import { useClient4 } from '../network/useClient4';
import { useStakingPoolStatus } from './useStakingPoolStatus';
import { useStakingPoolMember } from './useStakingPoolMember';
import { StakingPoolState } from '../../types';

export function useStakingPool(address: Address, nominator?: Address): StakingPoolState | null {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let selected = useSelectedAccount()?.address;
    let params = useStakingPoolParams(address, client, isTestnet);
    let status = useStakingPoolStatus(address, client, isTestnet);
    let member = useStakingPoolMember(address, nominator ?? selected, client, isTestnet) || null;
    if (!params || !status) {
        return null;
    }

    return {
        params,
        status,
        member,
    };
}