import { Engine } from "../Engine";
import { Address } from "ton";
import { useItem, useOptItem } from "../persistence/PersistedItem";
import { KnownPools } from "../../utils/KnownPools";
import { selector, useRecoilValue } from "recoil";
import { AppConfig } from "../../AppConfig";
import BN from "bn.js";

export class StakingPoolsProduct {
    readonly engine: Engine;
    readonly pools: Address[] = [];
    readonly full;

    constructor(engine: Engine) {
        this.engine = engine;
        this.pools = Object.keys(KnownPools).map((key) => Address.parse(key));
        this.full = selector({
            key: 'staking/' + this.engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            get: ({ get }) => {
                let pools: { address: Address, balance: BN }[] = [];
                let total = new BN(0);
                for (let p of this.pools) {
                    const state = get(this.engine.persistence.staking.item({ address: p, target: this.engine.address }).atom);
                    if (state) {
                        const pool = {
                            address: p,
                            balance: state.member.balance
                                .add(state.member.pendingDeposit)
                                .add(state.member.withdraw)
                        }
                        total = total.add(pool.balance);
                        pools.push(pool);
                    } else {
                        pools.push({
                            address: p,
                            balance: new BN(0)
                        });
                    }
                }
                return {
                    pools,
                    total
                };
            },
            dangerouslyAllowMutability: true
        });
    }

    useStaking() {
        return useRecoilValue(this.full);
    }

    usePool(pool?: Address) {
        if (!pool) {
            return null;
        }
        return useOptItem(this.engine.persistence.staking.item({ address: pool, target: this.engine.address }));
    }
}