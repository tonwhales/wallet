import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { log } from "../../utils/log";
import { Engine } from "../Engine";
import { startDependentSync } from "./utils/startDependentSync";

export function startHintsTxSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/hints/tx`;
    let account = engine.persistence.fullAccounts.item(address);
    let state = engine.persistence.accountHints.item(address);

    startDependentSync(key, account, engine, async (account) => {

        // Collect referenced addresses
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

        // Persist
        state.update((s) => {
            if (s) {

                // Result array
                let res = [...s];

                // Existing
                let ex = new Set<string>();
                for (let a of s) {
                    ex.add(a.toFriendly({ testOnly: AppConfig.isTestnet }));
                }

                // New
                for (let m of mentioned) {
                    if (!ex.has(m)) {
                        res.push(Address.parse(m));
                        log('[hints]: ' + m);
                    }
                }

                return res;
            } else {
                return Array.from(mentioned).map(Address.parse);
            }
        });
    });
}