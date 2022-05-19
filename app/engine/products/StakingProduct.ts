import { Engine } from "../Engine";
import { Address } from "ton";
import { useItem } from "../persistence/PersistedItem";

export class StakingPoolProduct {
    readonly engine: Engine;
    readonly pool: Address;

    constructor(engine: Engine, pool: Address) {
        this.engine = engine;
        this.pool = pool;
    }

    useState() {
        return useItem(this.engine.persistence.staking.item({ address: this.pool, target: this.engine.address }));
    }
}