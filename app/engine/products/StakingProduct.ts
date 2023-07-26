import { Engine } from "../Engine";
import { Address } from "ton";
import { useOptItem } from "../persistence/PersistedItem";
import { KnownPools } from "../../utils/KnownPools";
import { RecoilState, RecoilValueReadOnly, atomFamily, selector, useRecoilValue, selectorFamily } from "recoil";
import BN from "bn.js";
import { WalletConfig } from "../api/fetchWalletConfig";

export type StakingState = {
    pools: {
        address: Address;
        balance: BN;
    }[];
    total: BN;
    config: WalletConfig | null;
}

export class StakingPoolsProduct {
    readonly engine: Engine;
    readonly pools: Address[] = [];
    readonly full: RecoilValueReadOnly<StakingState>
    readonly byAddress: ((address: string) => RecoilState<StakingState>) | null = null;
    readonly apyAtom;

    constructor(engine: Engine) {
        this.engine = engine;
        this.pools = Object.keys(KnownPools(this.engine.isTestnet)).map((key) => Address.parse(key));
        this.full = selector({
            key: 'staking/' + this.engine.address.toFriendly({ testOnly: this.engine.isTestnet }),
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
                let config = get(this.engine.persistence.walletConfig.item(this.engine.address).atom);
                return {
                    pools,
                    total,
                    config
                };
            },
            dangerouslyAllowMutability: true
        });
        this.apyAtom = this.engine.persistence.stakingApy.item().atom;
        this.byAddress = atomFamily<StakingState, string>({
            key: 'staking/byAddress',
            default: selectorFamily({
                key: 'staking/byAddress/default',
                get: (addressFriendly) => ({ get }) => {
                    let pools: { address: Address, balance: BN }[] = [];
                    let total = new BN(0);
                    let address;
                    try {
                        address = Address.parse(addressFriendly);
                    } catch {
                        return {
                            pools,
                            total,
                            config: null
                        };
                    }

                    for (let p of this.pools) {
                        const state = get(this.engine.persistence.staking.item({ address: p, target: address }).atom);
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
                    let config = get(this.engine.persistence.walletConfig.item(address).atom);
                    return {
                        pools,
                        total,
                        config
                    };
                },
                dangerouslyAllowMutability: true
            }),
            dangerouslyAllowMutability: true
        });
    }

    useStakingCurrent() {
        return useRecoilValue(this.full);
    }

    useStaking(address?: Address) {
        if (!address || !this.byAddress) {
            return null;
        }
        return useRecoilValue(this.byAddress(address.toFriendly({ testOnly: this.engine.isTestnet })));
    }

    useStakingApy() {
        return useRecoilValue(this.apyAtom);
    }

    usePool(pool?: Address) {
        if (!pool) {
            return null;
        }
        return useOptItem(this.engine.persistence.staking.item({ address: pool, target: this.engine.address }));
    }

    useStakingChart(pool?: Address) {
        if (!pool) {
            return null;
        }
        return useOptItem(this.engine.persistence.stakingChart.item({ address: pool, target: this.engine.address }));
    }
}