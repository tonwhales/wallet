import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { warn } from "../../utils/log";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { tryFetchJettonMaster } from "../metadata/introspections/tryFetchJettonMaster";
import { resolveLink } from "../../utils/resolveLink";

// Update this version to re-index
const CURRENT_VERSION = 1;

export type JettonMasterState = {
    version: number;
    name: string | null;
    symbol: string | null;
    image: string | null;
    description: string | null;
}

function safeTrim(src: string, length: number) {
    if (src.length > length) {
        return src.slice(0, length);
    } else {
        return src;
    }
}

export function startJettonMasterSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/jetton/master`;
    let master = engine.persistence.jettonMasters.item(address);
    let sync = createEngineSync(key, engine, async () => {
        if (master.value && master.value.version === CURRENT_VERSION) {
            return;
        }

        // Download state
        let res: JettonMasterState = { version: CURRENT_VERSION, name: null, symbol: null, image: null, description: null };
        if (master.value) {
            res = { ...res, ...master.value, version: CURRENT_VERSION };
        }
        let block = await engine.client4.getLastBlock();
        let masterInfo = await tryFetchJettonMaster(engine.client4, block.last.seqno, address);
        if (masterInfo && masterInfo.content && masterInfo.content.type === 'offchain') {
            // Resolve link
            let link: string | null = resolveLink(masterInfo.content.link);

            if (link) {
                let response = await backoff('jetton-master', () => axios.get(link!, { timeout: 5000 }));
                if (typeof response.data.name === 'string') {
                    res.name = safeTrim(response.data.name, 128);
                }
                if (typeof response.data.symbol === 'string') {
                    res.symbol = safeTrim(response.data.symbol, 6);
                }
                if (typeof response.data.description === 'string') {
                    res.description = safeTrim(response.data.description, 512);
                }
                if (typeof response.data.image === 'string') {
                    res.image = safeTrim(response.data.image, 128);
                }
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