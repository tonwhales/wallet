import { Address } from '@ton/core';
import { StakingPoolParams, useStakingPoolParams } from './useStakingPoolParams';
import { useSelectedAccount } from '../appstate/useSelectedAccount';
import { useNetwork } from '../network/useNetwork';
import { useClient4 } from '../network/useClient4';
import { StakingPoolStatus, useStakingPoolStatus } from './useStakingPoolStatus';
import { StakingPoolMember, useStakingPoolMember } from './useStakingPoolMember';

export type StakingPoolState = {
    params: StakingPoolParams;
    status: StakingPoolStatus;
    member: StakingPoolMember | null;
}

export function useStakingPool(address: Address): StakingPoolState | null {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let selected = useSelectedAccount()?.address;
    let params = useStakingPoolParams(address, client, isTestnet);
    let status = useStakingPoolStatus(address, client, isTestnet);
    let member = useStakingPoolMember(address, selected, client, isTestnet) || null;
    if (!params || !status) {
        return null;
    }

    return {
        params,
        status,
        member,
    };
}