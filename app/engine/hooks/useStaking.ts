import { useStakingWalletConfig } from './staking/useStakingWalletConfig';
import { useSelectedAccount } from './useSelectedAccount';
import { Address } from '@ton/core';
import { KnownPools } from '../../utils/KnownPools';
import { useNetwork } from './useNetwork';
import { useStakingPoolMembers } from './staking/useStakingPoolMember';
import { useClient4 } from './useClient4';

export function useStaking() {
    let selected = useSelectedAccount();
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let config = useStakingWalletConfig(selected.addressString);
    let knownPools = Object.keys(KnownPools(isTestnet)).map((key) => Address.parse(key));
    let members = useStakingPoolMembers(client, isTestnet, knownPools.map(p => ({ pool: p, member: selected.address })));
    
    let pools: { address: Address, balance: bigint }[] = [];
    let total = BigInt(0);
    for (let p of knownPools) {
        let member = members.find(a => a?.pool === p.toString({ testOnly: isTestnet }));
        if (member) {
            const pool = {
                address: p,
                balance: member.balance + member.pendingDeposit + member.withdraw
            }
            total = total + pool.balance;
            pools.push(pool);
        } else {
            pools.push({
                address: p,
                balance: BigInt(0)
            });
        }
    }
    return {
        pools,
        total,
        config
    };
}