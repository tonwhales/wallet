import { Engine } from "../Engine";
import { Address } from "ton";
import { useItem, useOptItem } from "../persistence/PersistedItem";

export class StakingPoolProduct {
    readonly engine: Engine;
    readonly pool: Address;

    constructor(engine: Engine, pool: Address) {
        this.engine = engine;
        this.pool = pool;
    }

    useState() {
        return useOptItem(this.engine.persistence.staking.item({ address: this.pool, target: this.engine.address }));
    }
}