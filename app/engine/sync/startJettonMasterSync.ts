import { Address } from "ton";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { tryFetchJettonMaster } from "../metadata/introspections/tryFetchJettonMaster";
import { ImagePreview } from "../api/fetchAppData";
import { fetchJettonMasterContent } from "../metadata/fetchJettonMasterContent";

// Update this version to re-index
const CURRENT_VERSION = 2;

export type JettonMasterState = {
    version: number;
    name: string | null;
    symbol: string | null;
    image: ImagePreview | null;
    description: string | null;
    originalImage: string | null | undefined;
    decimals: number | null;
}

function safeTrim(src: string, length: number) {
    if (src.length > length) {
        return src.slice(0, length);
    } else {
        return src;
    }
}

export function startJettonMasterSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: engine.isTestnet })}/jetton/master`;
    let master = engine.persistence.jettonMasters.item(address);
    let sync = createEngineSync(key, engine, async () => {
        // Check if has value and is lates version
        if (
            master.value
            && (!!master.value.name && !!master.value.symbol && !!master.value.description)
            && master.value.version === CURRENT_VERSION
        ) {
            return;
        }

        // Download state
        let res: JettonMasterState = {
            version: CURRENT_VERSION,
            name: null,
            symbol: null,
            image: null,
            description: null,
            decimals: null,
            originalImage: null
        };
        if (master.value) {
            res = { ...res, ...master.value, version: CURRENT_VERSION };
        }
        let block = await engine.client4.getLastBlock();
        let masterInfo = await tryFetchJettonMaster(engine.client4, block.last.seqno, address);
        if (masterInfo && masterInfo.content) {
            // Fetch content
            const content = await fetchJettonMasterContent(address, engine.isTestnet);
            if (content) {
                res = { ...res, ...content };
            }
        }

        // Persist
        master.update((src) => {
            if (src) {
                return {
                    ...src,
                    ...res
                }
            } else {
                return res;
            }
        });
    });
    sync.invalidate();
}