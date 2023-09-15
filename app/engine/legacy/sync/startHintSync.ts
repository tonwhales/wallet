import { Address } from "@ton/core";
import { createLogger } from "../../../utils/log";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { fetchMetadata } from "../../metadata/fetchMetadata";
import { tryGetJettonWallet } from "../../metadata/introspections/tryGetJettonWallet";
import { registerKnownJettonMaster, registerKnownJettonWallet } from "./ops";

const logger = createLogger('hints');

const CURRENT_VERSION = 1;

export type HintProcessingState = {
    version: number;
    seqno: number;
};

export function startHintSync(address: Address, engine: Engine, own?: Address) {
    let key = `${address.toString({ testOnly: engine.isTestnet })}/hint`;
    let hint = engine.persistence.hintState.item(address);
    let request = engine.persistence.hintRequest.item(address);
    let metadataItem = engine.persistence.metadata.item(address);
    const sync = createEngineSync(key, engine, async () => {

        //
        // Requested Seqno
        //

        let requestedSeqno = request.value;

        //
        // Check if invesigation required
        //

        if (hint.value
            && (hint.value.version === CURRENT_VERSION)
            && (requestedSeqno === null || hint.value.seqno >= requestedSeqno)) {
            return;
        }

        //
        // Start investigation
        //

        logger.log(`${address.toString({ testOnly: engine.isTestnet })}: Start hint investigation`);

        //
        // Read seqno
        //

        let seqno: number;
        if (requestedSeqno !== null) {
            seqno = requestedSeqno;
        } else {
            seqno = (await engine.client4.getLastBlock()).last.seqno;
        }
        logger.log(`${address.toString({ testOnly: engine.isTestnet })}: Investigate at #${seqno}`);

        //
        // Collect metadata
        //

        let metadata = await fetchMetadata(engine.client4, seqno, address);

        //
        // Persist metadata
        //

        metadataItem.update(() => metadata); // TODO: Implement correct merge

        //
        // Process jetton master
        //

        if (metadata.jettonMaster) {
            let wallet = await tryGetJettonWallet(engine.client4, seqno, { address: own ?? engine.address, master: address });
            if (wallet) {

                // Register master
                registerKnownJettonMaster(engine, address);

                // Register wallet
                registerKnownJettonWallet(engine, own ?? engine.address, wallet);
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

        //
        // Persist
        //

        logger.log(`${address.toString({ testOnly: engine.isTestnet })}: Finished for #${seqno}`);
        hint.update(() => ({
            version: CURRENT_VERSION,
            seqno
        }));
    });

    // Invalidate on start
    sync.invalidate();

    // Invalidate on request
    request.for(() => sync.invalidate());
}