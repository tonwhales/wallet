import BN from "bn.js";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Lockup } from "../metadata/Metadata";

export class LockupProduct {

    readonly engine: Engine;
    readonly #wallets: RecoilValueReadOnly<{ metadata: Lockup, address: Address }[]>;
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
                    const metadata = get(this.engine.persistence.metadata.item(lockup).atom)?.lockup;
                    if (metadata) {
                        wallets.push({
                            address: lockup,
                            metadata
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
                    const wallet = wallets[i];
                    balance = balance.add(wallet.metadata.totalLockedValue ?? new BN(0));
                    balance = balance.add(wallet.metadata.totalRestrictedValue ?? new BN(0));
                }
                return balance;
            }
        });
    }

    useLockupWallets() {
        return useRecoilValue(this.#wallets);
    }

    useLockuoBalance() {
        return useRecoilValue(this.#balance);
    }

    useLockupWallet(address: Address) {
        return useRecoilValue(this.engine.persistence.metadata.item(address).atom)?.lockup;
    }
}