import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { createLogger } from "../../utils/log";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { fetchMetadata } from "./metadata/fetchMetadata";
import { tryGetJettonWallet } from "./metadata/introspections/tryGetJettonWallet";
import { registerKnownJettonMaster, registerKnownJettonWallet } from "./ops";

const logger = createLogger('hints');

const CURRENT_VERSION = 1;

export type HintProcessingState = {
    version: number;
};

export function startHintSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/hint`;
    let hint = engine.persistence.hintState.item(address);
    const sync = createEngineSync(key, engine, async () => {

        // Check if invesigation required
        if (hint.value && hint.value.version === CURRENT_VERSION) {
            return;
        }

        // Start investigation
        logger.log(`${address.toFriendly({ testOnly: AppConfig.isTestnet })}: Start hint investigation`);

        // Collect metadata
        let last = await engine.client4.getLastBlock();
        let metadata = await fetchMetadata(engine.client4, last.last.seqno, address);

        //
        // Process jetton master
        //

        if (metadata.jettonMaster) {
            let wallet = await tryGetJettonWallet(engine.client4, last.last.seqno, { address: engine.address, master: address });
            if (wallet) {

                // Register master
                registerKnownJettonMaster(engine, address);

                // Register wallet
                registerKnownJettonWallet(engine, engine.address, wallet);
            }
        }

        //
        // Process jetton wallet
        //

        if (metadata.jettonWallet) {

            // Register master
            registerKnownJettonMaster(engine, metadata.jettonWallet.master);

            // Register wallet
            registerKnownJettonWallet(engine, metadata.jettonWallet.owner, address);
        }

        // Persist
        let newState: HintProcessingState = {
            version: CURRENT_VERSION
        };
        hint.update(() => newState);
    });
    sync.invalidate();
}