import BN from "bn.js";
import { Address } from "ton";
import { KnownPools } from "./KnownPools";

export type StakingPoolType = 'club' | 'team' | 'nominators' | 'epn' | 'lockup';

export function filterPools(pools: { address: Address, balance: BN }[], type: StakingPoolType, processed: Set<string>, isTestnet: boolean) {
    return pools.filter((v) => KnownPools(isTestnet)[v.address.toFriendly({ testOnly: isTestnet })].name.toLowerCase().includes(type) && !processed.has(v.address.toFriendly({ testOnly: isTestnet })));
}