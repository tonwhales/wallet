import BN from "bn.js";
import { Address } from "@ton/core";
import { Engine } from "../Engine";
import { tryFetchJettonWallet } from "../../metadata/introspections/tryFetchJettonWallet";
import { startDependentSync } from "./utils/startDependentSync";

export type JettonWalletState = {
    block: number;
    balance: bigint;
    master: Address | null;
};

export function startJettonWalletSync(address: Address, engine: Engine) {
    let key = `${address.toString({ testOnly: engine.isTestnet })}/jetton/wallet`;
    let lite = engine.persistence.liteAccounts.item(address);
    let jettonWallet = engine.persistence.jettonWallets.item(address);

    startDependentSync(key, lite, engine, async (acc) => {

        // Last state
        let src = jettonWallet.value;

        // Check updated
        if (src && src.block >= acc.block) {
            return;
        }

        // Fetch jetton wallet
        let wallet = await tryFetchJettonWallet(engine.client4, acc.block, address);

        // Update state
        let newState: JettonWalletState
        if (!wallet) {
            newState = { block: acc.block, balance: BigInt(0), master: null };
        } else {
            newState = { block: acc.block, balance: wallet.balance, master: wallet.master };
        }
        jettonWallet.update(() => newState);
    });
}