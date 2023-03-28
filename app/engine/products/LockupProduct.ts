import BN from "bn.js";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { KnownPools } from "../../utils/KnownPools";
import { fetchWalletConfig } from "../api/fetchWalletConfig";
import { Engine } from "../Engine";
import { useOptItem } from "../persistence/PersistedItem";
import { LockupWalletState } from "../sync/startLockupWalletSync";
import { InvalidateSync } from "../utils/InvalidateSync";

export class LockupProduct {
    readonly engine: Engine;
    readonly #wallets: RecoilValueReadOnly<{ state: LockupWalletState, address: Address }[]>;
    readonly #balance: RecoilValueReadOnly<BN>;
    readonly pools: Address[] = [];
    private _watched: Set<string> = new Set();

    constructor(engine: Engine) {
        this.engine = engine;
        this.pools = Object.keys(KnownPools).map((key) => Address.parse(key));

        this.#wallets = selector({
            key: 'lockups/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/wallets',
            get: ({ get }) => {
                const lockups = get(this.engine.persistence.knownAccountLockups.item(this.engine.address).atom);
                if (!lockups) {
                    return [];
                }
                const wallets = [];
                for (let i = 0; i < lockups.length; i++) {
                    const lockup = lockups[i];
                    const wallet = get(this.engine.persistence.lockupWallets.item(lockup).atom);
                    if (!!wallet) {
                        wallets.push({
                            address: lockup,
                            state: wallet
                        });
                    }
                }
                return wallets;
            }
        });

        this.#balance = selector({
            key: 'lockups/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/balance',
            get: ({ get }) => {
                const wallets = get(this.#wallets);
                let balance = new BN(0);
                for (let i = 0; i < wallets.length; i++) {
                    balance = balance.add(wallets[i].state.balance);

                    const locked = wallets[i].state.wallet?.totalLockedValue;
                    if (!!locked) {
                        balance = balance.add(locked);
                    }
                    const restricted = wallets[i].state.wallet?.totalRestrictedValue;
                    if (!!restricted) {
                        balance = balance.add(restricted);
                    }
                }
                return balance;
            }
        });

        this.engine.persistence.knownAccountLockups.item(this.engine.address).for((lockups) => {
            lockups.forEach((lockup) => {
                if (this._watched.has(lockup.toFriendly({ testOnly: AppConfig.isTestnet }))) {
                    return;
                }

                this._watched.add(lockup.toFriendly({ testOnly: AppConfig.isTestnet }));
                this.watchLockup(lockup)
            });
        });

    }

    usePool(member: Address, pool?: Address) {
        if (!pool) {
            return null;
        }
        return useOptItem(this.engine.persistence.staking.item({ address: pool, target: member }));
    }

    useLockupWallets() {
        return useRecoilValue(this.#wallets);
    }

    useLockupBalance() {
        return useRecoilValue(this.#balance);
    }

    useLockupWallet(address: Address) {
        return useRecoilValue(this.engine.persistence.lockupWallets.item(address).atom);
    }

    watchLockup(address: Address) {
        let ended = false;
        const invalidateSync = new InvalidateSync(
            `lockup/config/${address.toFriendly({ testOnly: AppConfig.isTestnet })}`,
            async () => {
                let config = await fetchWalletConfig(address);
                if (ended) {
                    return;
                }
                this.engine.persistence.walletConfig.setValue(address, config);
            });
        // Query every 15 seconds
        const timer = setInterval(() => {
            invalidateSync.invalidate();
        }, 15 * 1000);
        return () => {
            if (!ended) {
                ended = true;
                clearInterval(timer);
            }
        }
    }
}