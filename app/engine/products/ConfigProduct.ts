import { useRecoilValue } from "recoil";
import { Engine } from "../Engine";

export class ConfigProduct {
    readonly engine: Engine;
    constructor(engine: Engine) {
        this.engine = engine;
    }

    useConfig() {
        return useRecoilValue(this.engine.persistence.config.item().atom);
    }
}