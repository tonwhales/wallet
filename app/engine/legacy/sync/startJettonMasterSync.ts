import { Address } from "ton";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { tryFetchJettonMaster } from "../../metadata/introspections/tryFetchJettonMaster";
import { ImagePreview } from "../../api/fetchAppData";
import { fetchJettonMasterContent } from "../../metadata/fetchJettonMasterContent";

// Update this version to re-index
const CURRENT_VERSION = 2;


export function startJettonMasterSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: engine.isTestnet })}/jetton/master`;
    let master = engine.persistence.jettonMasters.item(address);
    let sync = createEngineSync(key, engine, async () => {
    });
    sync.invalidate();
}