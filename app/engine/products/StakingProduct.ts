import { Engine } from "../Engine";
import { Address } from "ton";
import { useOptItem } from "../persistence/PersistedItem";
import { KnownPools } from "../../utils/KnownPools";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { AppConfig } from "../../AppConfig";
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
    readonly apyAtom;

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
                let config = get(this.engine.persistence.walletConfig.item(this.engine.address).atom);
                return {
                    pools,
                    total,
                    config
                };
            },
            dangerouslyAllowMutability: true
        });
        this.#fullAddress = atomFamily<StakingFull, string>({
            key: 'staking/' + this.engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/full',
            default: selectorFamily({
                key: 'staking/' + this.engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/full/address',
                get: (addr: string) => ({ get }) => {
                    let address = Address.parse(addr);
                    let pools: { address: Address, balance: BN }[] = [];
                    let total = new BN(0);
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
        this.apyAtom = this.engine.persistence.stakingApy.item().atom;
    }

    useStaking(address?: Address) {
        if (address) {
            return useRecoilValue(this.#fullAddress(address.toFriendly({ testOnly: AppConfig.isTestnet })));
        }
        return useRecoilValue(this.full);
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