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
    }

    useLockupWallets() {
        return useRecoilValue(this.#wallets);
    }

    useLockupWallet(address: Address) {
        return useRecoilValue(this.engine.persistence.metadata.item(address).atom)?.lockup;
    }
}