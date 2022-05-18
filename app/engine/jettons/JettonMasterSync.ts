import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { warn } from "../../utils/log";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";
import { tryFetchJettonMaster } from "../metadata/introspections/tryFetchJettonMaster";
import { PersistedValueSync } from "../persistence/PersistedValueSync";

export type JettonMasterState = {
    name: string | null;
    symbol: string | null;
    image: string | null;
    description: string | null;
}

export class JettonMasterSync extends PersistedValueSync<JettonMasterState> {

    readonly address: Address;

    constructor(address: Address, engine: Engine) {
        super(`jetton-master(${address.toFriendly({ testOnly: AppConfig.isTestnet })})`, engine.storage.jettonMaster(address), engine);
        this.address = address;
        this.invalidate();
    }

    protected doSync = async (src: JettonMasterState | null): Promise<JettonMasterState | null> => {
        if (src) {
            return null;
        }

        let res: JettonMasterState = { name: null, symbol: null, image: null, description: null };
        let block = await this.engine.client4.getLastBlock();
        let master = await tryFetchJettonMaster(this.engine.client4, block.last.seqno, this.address);
        if (master && master.content && master.content.type === 'offchain') {
            // Resolve link
            let link: string | null = null;
            try {
                new URL(master.content.link);
                link = master.content.link;
            } catch (e) {
                warn(e);
            }

            if (link) {
                let response = await backoff('jetton-master', () => axios.get(link!, { timeout: 5000 }));
                if (typeof response.data.name === 'string') {
                    res.name = response.data.name;
                }
                if (typeof response.data.symbol === 'string') {
                    res.symbol = response.data.symbol;
                }
                if (typeof response.data.description === 'string') {
                    res.description = response.data.description;
                }
                if (typeof response.data.image === 'string') {
                    res.image = response.data.image;
                }
            }
        }

        return res;
    };
}