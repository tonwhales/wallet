import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { fetchPlugins } from "../api/fetchPlugins";
import { fetchSeqno } from "../api/fetchSeqno";
import { Engine } from "../Engine";
import { PersistedValueSync } from "../utils/PersistedValueSync";
import { AccountFullSync } from "./AccountFullSync";

export type WalletV4State = {
    block: number;
    seqno: number;
    balance: BN,
    plugins: Address[],
    transactions: string[]
}

export class WalletV4Sync extends PersistedValueSync<WalletV4State> {

    readonly engine: Engine;
    readonly parent: AccountFullSync;
    readonly address: Address;

    constructor(parent: AccountFullSync) {
        super(`wallet-v4(${parent.address.toFriendly({ testOnly: AppConfig.isTestnet })})`, parent.engine.storage.wallet(parent.address), parent.engine);

        this.engine = parent.engine;
        this.address = parent.address;
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

    protected doSync = async (src: WalletV4State | null): Promise<WalletV4State | null> => {

        // Check parent
        const parentValue = this.parent.current;
        if (!parentValue) {
            return null;
        }

        // Check updated
        if (src && src.block >= parentValue.block) {
            return null;
        }

        // Fetch seqno
        let seqno = await fetchSeqno(this.engine.client4, parentValue.block, this.address);

        // Fetch plugins
        let plugins = (await fetchPlugins(this.engine.client4, parentValue.block, this.address));

        return {
            seqno,
            block: parentValue.block,
            balance: parentValue.balance,
            plugins,
            transactions: parentValue.transactions
        };
    }
}