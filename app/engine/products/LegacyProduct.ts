import BN from "bn.js";
import { Address, contractAddress, WalletV1R1Source, WalletV1R2Source, WalletV1R3Source, WalletV2R1Source, WalletV2R2Source, WalletV3R1Source, WalletV3R2Source } from "ton";
import { AccountLiteAtom } from "../sync/AccountLiteAtom";
import { Engine } from "../Engine";
import { useOptItem } from "../persistence/PersistedItem";

export class LegacyProduct {

    readonly engine: Engine;
    readonly wallets: AccountLiteAtom[] = [];

    constructor(engine: Engine) {
        this.engine = engine;

        let addresses: Address[] = [];
        addresses.push(contractAddress(WalletV1R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV1R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV1R3Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV2R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV2R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV3R1Source.create({ publicKey: engine.publicKey, workchain: 0 })));
        addresses.push(contractAddress(WalletV3R2Source.create({ publicKey: engine.publicKey, workchain: 0 })));

        for (let addr of addresses) {
            this.wallets.push(this.engine.sync.getLiteSyncForAddress(addr));
        }
    }

    useState = () => {
        let b = new BN(0);
        for (let w of this.wallets) {
            let account = useOptItem(this.engine.model.accountLite(w.address));
            if (account) {
                b = b.add(account.balance);
            }
        }
        return b;
    }

    useStateFull() {
        let wallets: { address: Address, balance: BN }[] = [];
        for (let w of this.wallets) {
            let account = useOptItem(this.engine.model.accountLite(w.address));
            if (account) {
                wallets.push({ address: w.address, balance: account.balance });
            } else {
                wallets.push({ address: w.address, balance: new BN(0) });
            }
        }
        return wallets;
    }
}