import { Address } from "ton";
import { Engine } from "../Engine";
import { WalletPersisted } from "../Persistence";
import { SmartAccountSync } from "./SmartAccountSync";

export type WalletDataSync = SmartAccountSync<WalletPersisted>;

export function createWalletDataSync(address: Address, engine: Engine): WalletDataSync {
    return new SmartAccountSync<WalletPersisted>({
        key: 'wallet',
        engine,
        address,
        extractor: async (src) => {

            // Fetch seqno
            let seqnoRes = await engine.client4.runMethod(src.block, address, 'seqno');
            let seqno = 0;
            if (seqnoRes.exitCode === 0 || seqnoRes.exitCode === 1) {
                if (seqnoRes.result[0].type !== 'int') {
                    throw Error('Invalid response');
                }
                seqno = seqnoRes.result[0].value.toNumber();
            }

            return { seqno, balance: src.balance.toString(10), transactions: src.transactions };
        },
        converter: (src) => src,
        collection: engine.persistence.wallets
    })
}