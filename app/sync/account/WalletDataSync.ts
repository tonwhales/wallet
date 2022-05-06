import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { WalletPersisted } from "../Persistence";
import { fetchPlugins } from "./api/fetchPlugins";
import { fetchSeqno } from "./api/fetchSeqno";
import { SmartAccountSync } from "./utils/SmartAccountSync";

export type WalletDataSync = SmartAccountSync<WalletPersisted>;

export function createWalletDataSync(address: Address, engine: Engine): WalletDataSync {
    return new SmartAccountSync<WalletPersisted>({
        key: 'wallet',
        engine,
        address,
        extractor: async (src) => {

            // Fetch seqno
            let seqno = await fetchSeqno(engine.client4, src.block, address);

            // Fetch plugins
            let plugins = (await fetchPlugins(engine.client4, src.block, address)).map((v) => v.toFriendly({ testOnly: AppConfig.isTestnet }));
            console.log({ plugins });

            return {
                seqno,
                balance: src.balance.toString(10),
                plugins,
                transactions: src.transactions
            };
        },
        collection: engine.persistence.wallets
    });
}