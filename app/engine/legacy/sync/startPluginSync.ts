import { Address } from "@ton/core";
import { Engine } from "../Engine";
import { tryFetchLegacyPlugin } from "../../metadata/introspections/tryFetchLegacyPlugin";
import { LegacySubscription } from "../plugins/LegacySubscription";
import { startDependentSync } from "./utils/startDependentSync";

export type PluginState =
    | { type: 'unknown' }
    | { type: 'legacy-subscription', state: LegacySubscription };

export function startPluginSync(address: Address, engine: Engine) {

    let key = `${address.toString({ testOnly: engine.isTestnet })}/plugin`;
    let lite = engine.persistence.liteAccounts.item(address);
    let item = engine.persistence.plugins.item(address);

    startDependentSync(key, lite, engine, async (src) => {
        // Fetch plugin
        let plugin = await tryFetchLegacyPlugin(engine.client4, src.block, address);

        // Resolve plugin
        let res: PluginState;
        if (plugin) {
            res = { type: 'legacy-subscription', state: plugin };
        } else {
            res = { type: 'unknown' };
        }

        // Persist
        item.update(() => res);
    });
}