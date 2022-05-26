import { useRecoilValue } from "recoil";
import { Engine } from "../Engine";

export class ServerConfigProduct {
    readonly engine: Engine;
    constructor(engine: Engine) {
        this.engine = engine;
    }

    useServerConfig() {
        return useRecoilValue(this.engine.persistence.serverConfig.item().atom);
    }
}