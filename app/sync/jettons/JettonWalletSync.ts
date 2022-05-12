import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { AccountLiteAtom } from "../account/AccountLiteAtom";
import { Engine } from "../Engine";
import { tryFetchJettonWallet } from "../metadata/introspections/tryFetchJettonWallet";
import { PersistedValueSync } from "../utils/PersistedValueSync";

export type JettonWalletState = {
    block: number;
    balance: BN;
    master: Address | null;
};

export class JettonWalletSync extends PersistedValueSync<JettonWalletState> {

    readonly address: Address;
    readonly parent: AccountLiteAtom;
    readonly engine: Engine;

    constructor(parent: AccountLiteAtom) {
        super(`jetton-wallet(${parent.address.toFriendly({ testOnly: AppConfig.isTestnet })})`, parent.engine.storage.jettonWallet(parent.address), parent.engine);

        this.address = parent.address;
        this.engine = parent.engine;
        this.parent = parent;

        // Forward parent
        if (parent.ready) {
            this.invalidate();
        }
        parent.ref.on('ready', () => {
            this.invalidate();
        });
        parent.ref.on('updated', () => {
            this.invalidate();
        });
    }

    protected doSync = async (src: JettonWalletState | null): Promise<JettonWalletState | null> => {

        // Parent value
        let acc = this.parent.current;
        if (!acc) {
            return null;
        }

        // Check updated
        if (src && src.block >= acc.block) {
            return null;
        }

        // Fetch jetton wallet
        let wallet = await tryFetchJettonWallet(this.engine.client4, acc.block, this.address);

        // If wallet invalid or doesn't exist
        if (!wallet) {
            return { block: acc.block, balance: new BN(0), master: null };
        }

        return { block: acc.block, balance: wallet.balance, master: wallet.master };
    }
}