import { Engine } from "../Engine";
import { StakingPool } from "../../utils/KnownPools";
import { StakingPoolSync } from "../account/StakingPoolSync";

export class StakingPoolProduct {
    readonly engine: Engine;
    readonly sync: StakingPoolSync;

    constructor(engine: Engine, pool: StakingPool) {
        this.engine = engine;
        this.sync = new StakingPoolSync(engine.address, engine.accounts.getLiteSyncForAddress(pool.address), engine);
    }

    get ready() {
        return !!this.sync.ref.ready;
    }

    get state() {
        return this.sync.ref.value;
    }

    useState() {
        return this.sync.ref.use();
    }

    async awaitReady() {
        await this.sync.ref.awaitReady();
    }
}