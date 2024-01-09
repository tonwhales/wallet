import { Address } from "@ton/core";
import { useSelectedAccount } from "../appstate";
import { useClient4, useNetwork } from "../network";
import { useStakingPoolMembers } from ".";
import { KnownPools } from "../../../utils/KnownPools";

export function useStakingActive(address?: Address) {
    let selected = useSelectedAccount();
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let knownPools = Object.keys(KnownPools(isTestnet)).map((key) => Address.parse(key));
    let members = useStakingPoolMembers(client, isTestnet, knownPools.map(p => ({ pool: p, member: address ?? selected!.address })));

    let pools: { address: Address, balance: bigint }[] = [];

    for (let pool of knownPools) {
        let member = members.find(a => a?.pool === pool.toString({ testOnly: isTestnet }));
        if (member && (member.balance > 0n || member.pendingDeposit > 0n)) {
            pools.push({ address: pool, balance: member.balance + member.pendingDeposit });
        }
    }

    return pools;
}