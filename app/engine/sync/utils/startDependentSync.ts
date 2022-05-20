import { Engine } from "../../Engine";
import { PersistedItem } from "../../persistence/PersistedItem";
import { createEngineSync } from "../../utils/createEngineSync";

export function startDependentSync<T>(key: string, item: PersistedItem<T>, engine: Engine, handler: (src: T) => Promise<void>) {

    // Sync
    const sync = createEngineSync(key, engine, async () => {
        let acc = item.value;
        if (!acc) {
            return;
        }
        await handler(acc);
    });

    // Forward parent
    if (item.value) {
        sync.invalidate();
    }
    item.on('updated', () => {
        sync.invalidate();
    });
}