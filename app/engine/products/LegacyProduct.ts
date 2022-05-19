import BN from "bn.js";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { Address, contractAddress, WalletV1R1Source, WalletV1R2Source, WalletV1R3Source, WalletV2R1Source, WalletV2R2Source, WalletV3R1Source, WalletV3R2Source } from "ton";
import { Engine } from "../Engine";

export class LegacyProduct {

    readonly engine: Engine;
    readonly wallets: Address[] = [];
    readonly atom: RecoilValueReadOnly<BN>;
    readonly atomFull: RecoilValueReadOnly<{ address: Address, balance: BN }[]>;

    constructor(engine: Engine) {
        this.engine = engine;
        this.wallets.push(contractAddress(WalletV1R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV1R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV1R3Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV2R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV2R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV3R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        this.wallets.push(contractAddress(WalletV3R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));

        this.atom = selector({
            key: 'selector/legacy',
            get: ({ get }) => {
                let b = new BN(0);
                for (let w of this.wallets) {
                    let account = get(this.engine.model.accountLite(w).atom);
                    if (account) {
                        b = b.add(account.balance);
                    }
                }
                return b;
            }
        });
        this.atomFull = selector({
            key: 'selector/legacy/full',
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
            }
        });
    }

    useState = () => {
        return useRecoilValue(this.atom);
    }

    useStateFull = () => {
        return useRecoilValue(this.atomFull);
    }
}