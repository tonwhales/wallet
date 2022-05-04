import { Address } from "ton";
import { Engine } from "../Engine";
import { tryFetchLegacyPlugin } from "../metadata/introspections/tryFetchLegacyPlugin";
import { LegacySubscription } from "../metadata/Metadata";
import { LiteAccount } from "./AccountLiteSync";
import { Sync } from "./utils/Sync";

export type PluginState =
    | { type: 'unknown' }
    | { type: 'legacy-subscription', state: LegacySubscription };

export class PluginSync extends Sync<Address, PluginState> {

    readonly engine: Engine;
    #liteAccount: LiteAccount | null = null;

    constructor(engine: Engine, address: Address) {
        super({ key: address, collection: engine.persistence.plugins });
        this.engine = engine;
        let liteSync = engine.accounts.getLiteSyncForAddress(address);
        if (liteSync.ready) {
            this.#liteAccount = liteSync.state;
            this.invalidate();
        }
        liteSync.on('account_ready', (data) => {
            this.#liteAccount = data.state;
            this.invalidate();
        });
        liteSync.on('account_updated', (data) => {
            this.#liteAccount = data.state;
            this.invalidate();
        });
    }

    async doSync(address: Address): Promise<PluginState | null> {
        let acc = this.#liteAccount;
        if (!acc) {
            return null;
        }
        let plugin = await tryFetchLegacyPlugin(this.engine.client4, acc.block, address);
        if (plugin) {
            return { type: 'legacy-subscription', state: plugin };
        } else {
            return { type: 'unknown' };
        }
    }
}