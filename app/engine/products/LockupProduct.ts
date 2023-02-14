import BN from "bn.js";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { Address } from "ton";
import { Engine } from "../Engine";

export class LockupProduct {

    readonly engine: Engine;
    readonly wallets: Address[] = [];
    readonly atom: RecoilValueReadOnly<BN>;
    readonly atomFull: RecoilValueReadOnly<{ address: Address, balance: BN }[]>;

    constructor(engine: Engine) {
        this.engine = engine;

        // TODO: sync lockups with hints

        this.atom = selector({
            key: 'selector/lockup',
            get: ({ get }) => {
                let b = new BN(0);
                for (let w of this.wallets) {
                    let account = get(this.engine.model.accountLite(w).atom);
                    if (account) {
                        b = b.add(account.balance);
                    }
                }
                return b;
            },
            dangerouslyAllowMutability: true
        });
        this.atomFull = selector({
            key: 'selector/lockup/full',
            get: ({ get }) => {
                let wallets: { address: Address, balance: BN }[] = [];
                for (let w of this.wallets) {
                    let account = get(this.engine.model.accountLite(w).atom);
                    if (account) {
                        wallets.push({ address: w, balance: account.balance });
                    } else {
                        wallets.push({ address: w, balance: new BN(0) });
                    }
                }
                return wallets;
            },
            dangerouslyAllowMutability: true
        });
    }

    useState = () => {
        return useRecoilValue(this.atom);
    }

    useStateFull = () => {
        return useRecoilValue(this.atomFull);
    }
}