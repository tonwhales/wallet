import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { fetchPlugins } from "../api/fetchPlugins";
import { fetchSeqno } from "../api/fetchSeqno";
import { Engine } from "../Engine";
import { startDependentSync } from "./utils/startDependentSync";

export type WalletV4State = {
    block: number;
    seqno: number;
    balance: BN,
    plugins: Address[],
    transactions: string[]
}

export function startWalletV4Sync(address: Address, engine: Engine) {
    let key = `wallet-v4(${address.toFriendly({ testOnly: AppConfig.isTestnet })})`;
    let full = engine.persistence.fullAccounts.item(address);
    let wallet = engine.persistence.wallets.item(address);

    startDependentSync(key, full, engine, async (parentValue) => {
        let src = wallet.value;

        // If block not changed it might be just transactions
        if (src && src.block === parentValue.block) {
            let newState: WalletV4State = {
                ...src,
                transactions: parentValue.transactions
            };
            wallet.update(() => newState);
            return;
        }

        // Check updated
        if (src && src.block >= parentValue.block) {
            return;
        }

        // Fetch seqno
        let seqno = await fetchSeqno(engine.client4, parentValue.block, address);

        // Fetch plugins
        let plugins = (await fetchPlugins(engine.client4, parentValue.block, address));

        let newState: WalletV4State = {
            seqno,
            block: parentValue.block,
            balance: parentValue.balance,
            plugins,
            transactions: parentValue.transactions
        };
        wallet.update(() => newState);
    });
}