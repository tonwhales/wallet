import { WalletSync } from "./account/WalletSync";
import { WalletV4Sync } from "./account/WalletV4Sync";
import { Engine } from "./Engine";

export class AppSync {
    readonly engine: Engine;
    readonly wallet: WalletSync;

    constructor(engine: Engine) {
        this.engine = engine;
        this.wallet = new WalletSync(new WalletV4Sync(engine.accounts.getFullSyncForAddress(engine.address)));
    }
}