import BN from "bn.js";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Lockup } from "../metadata/Metadata";
import { LockupWalletState } from "../sync/startLockupWalletSync";

export class LockupProduct {

    readonly engine: Engine;
    readonly #wallets: RecoilValueReadOnly<{ state: LockupWalletState, address: Address }[]>;
    readonly #balance: RecoilValueReadOnly<BN>;

    constructor(engine: Engine) {
        this.engine = engine;

        // TODO: sync balances and metadata with Lockup state

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
}