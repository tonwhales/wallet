import { useStakingWalletConfig } from './useStakingWalletConfig';
import { useSelectedAccount } from '../appstate/useSelectedAccount';
import { Address } from '@ton/core';
import { KnownPools } from '../../../utils/KnownPools';
import { useNetwork } from '../network/useNetwork';
import { useStakingPoolMembers } from './useStakingPoolMember';
import { useClient4 } from '../network/useClient4';
import { StakingPoolMember } from '../../types';

function calculatePoolsAndTotal(knownPools: Address[], members: (StakingPoolMember | null | undefined)[], isTestnet: boolean) {
    // Convert members array to a Map for faster lookups
    const membersMap = new Map(members.map(member => [member?.pool, member]));

    // Initialize pools array and total balance
    let pools: { address: Address, balance: bigint }[] = [];
    let total = BigInt(0);

    // Iterate over knownPools and calculate pools and total
    for (let p of knownPools) {
        const poolAddressString = p.toString({ testOnly: isTestnet });
        const member = membersMap.get(poolAddressString);

        if (member) {
            const balance = member.balance + member.pendingDeposit + member.withdraw;
            pools.push({ address: p, balance });
            total += balance;
        } else {
            pools.push({ address: p, balance: BigInt(0) });
        }
    }

    return { pools, total };
}

export function useStaking(address?: Address) {
    let selected = useSelectedAccount();
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let config = useStakingWalletConfig(address?.toString({ testOnly: isTestnet }) ?? selected!.addressString);
    let knownPools = Object.keys(KnownPools(isTestnet)).map((key) => Address.parse(key));
    let members = useStakingPoolMembers(client, isTestnet, knownPools.map(p => ({ pool: p, member: address ?? selected!.address })));

    const { pools, total } = calculatePoolsAndTotal(knownPools, members, isTestnet);
    
    return {
        pools,
        total,
        config
    };
}