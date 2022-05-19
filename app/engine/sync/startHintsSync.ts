import { fetchHints } from "../api/fetchHints";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startHintsSync(engine: Engine) {
    let sync = createEngineSync('hints', engine, async () => {
        let hints = await fetchHints(engine.address);
        // TODO: Handle
        // console.warn(hints);
    });

    sync.invalidate();
}