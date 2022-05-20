import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { requestAllHintsIfNeeded } from "./ops";
import { startDependentSync } from "./utils/startDependentSync";

export function startHintsTxSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/hints/tx`;
    let account = engine.persistence.fullAccounts.item(address);

    startDependentSync(key, account, engine, async (account) => {

        //
        // Collect referenced addresses
        //

        let mentioned = new Set<string>();
        for (let t of account.transactions) {
            let tx = engine.transactions.get(address, t);
            if (tx.inMessage && tx.inMessage.info.src && !tx.inMessage.info.src.equals(address)) {
                mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
            for (let out of tx.outMessages) {
                if (out.info.dest && !out.info.dest.equals(address)) {
                    mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                }
            }
        }

        //
        // Request hints
        // TODO: Respect seqno
        //
        
        requestAllHintsIfNeeded(Array.from(mentioned).map((v) => Address.parse(v)), engine);
    });
}