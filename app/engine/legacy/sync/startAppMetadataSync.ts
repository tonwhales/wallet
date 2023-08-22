import { BoundedConcurrencyPool } from "teslabot";
import { backoff } from "../../../utils/time";
import { Engine } from "../Engine";
import { resolveLink } from "../../../utils/resolveLink";
import { fetchAppData } from "../../api/fetchAppData";

let lock = new BoundedConcurrencyPool(16);

export function startAppMetadataSync(link: string, engine: Engine) {
    let item = engine.persistence.dApps.item(link);

    backoff('metadata:' + link, async () => {
        lock.run(async () => {

            // Check if already downloaded
            if (item.value) {
                return;
            }

            // Fetch
            let data = await fetchAppData(resolveLink(link)!);
            if (!data) {
                throw Error('Invalid response');
            }

            // Persist
            item.update(() => data);
        });
    });
}