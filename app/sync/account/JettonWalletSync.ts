import axios from "axios";
import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { log, warn } from "../../utils/log";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";
import { tryFetchJettonMaster } from "../metadata/introspections/tryFetchJettonMaster";
import { tryFetchJettonWallet } from "../metadata/introspections/tryFetchJettonWallet";
import { ContractContent } from "../metadata/Metadata";
import { LiteAccount } from "./AccountLiteSync";
import { Sync } from "./utils/Sync";
import * as t from 'io-ts';

export type JettonWalletState = {
    version: number;
    content: ContractContent | undefined | null;
    master: Address | null,
    balance: BN
};

export class JettonWalletSync extends Sync<Address, JettonWalletState> {

    readonly version = 2;

    readonly engine: Engine;
    #liteAccount: LiteAccount | null = null;
    readonly address: Address;

    constructor(engine: Engine, address: Address) {
        super({ key: address, collection: engine.persistence.jettonWallets });
        this.engine = engine;
        this.address = address;
        let liteSync = engine.accounts.getLiteSyncForAddress(address);
        if (liteSync.ready) {
            this.#liteAccount = liteSync.state;
            this.invalidate();
        }
        liteSync.on('account_ready', (data) => {
            this.#liteAccount = data.state;
            this.invalidate();
        });
        liteSync.on('account_updated', (data) => {
            this.#liteAccount = data.state;
            this.invalidate();
        });
    }

    async doSync(address: Address, existing: JettonWalletState | null): Promise<JettonWalletState | null> {

        // Get current block
        let acc = this.#liteAccount;
        if (!acc) {
            return null;
        }

        log('[jettons]: Sync wallet ' + address.toFriendly({ testOnly: AppConfig.isTestnet }));

        // Fetch jetton wallet
        let wallet = await tryFetchJettonWallet(this.engine.client4, acc.block, address);

        // If wallet invalid or doesn't exist
        if (!wallet) {
            log('[jettons]: No wallet for ' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            return { version: this.version, balance: new BN(0), content: undefined, master: null };
        }

        // Fetch master info
        let content: ContractContent | undefined | null = null;
        if (!existing || existing.content === undefined || existing.version !== this.version) {
            log('[jettons]: Fetching metadata for ' + wallet.master.toFriendly({ testOnly: AppConfig.isTestnet }));
            let master = await tryFetchJettonMaster(this.engine.client4, acc.block, wallet.master);
            if (master && master.content != undefined) {
                if (master.content.type === 'offchain') {

                    // Resolve link
                    let link: string | null = null;
                    try {
                        new URL(master.content.link);
                        link = master.content.link;
                    } catch (e) {
                        warn(e);
                    }

                    // Download
                    if (link) {
                        log('[jettons]: Download metadata for ' + wallet.master.toFriendly({ testOnly: AppConfig.isTestnet }) + ' from ' + link);
                        let response = await backoff(() => axios.get(link!, { timeout: 5000 }));
                        log('[jettons]: Downloaded metadata for ' + wallet.master.toFriendly({ testOnly: AppConfig.isTestnet }) + ' from ' + link);
                        if (metadataCodec.is(response.data)) {
                            content = {
                                name: response.data.name,
                                symbol: response.data.symbol,
                                description: response.data.description,
                                image: response.data.image
                            };
                        }
                    }
                } else {
                    content = null;
                }
            }
        } else {
            content = existing.content;
        }

        return { version: this.version, balance: wallet.balance, content, master: wallet.master };
    }
}


const metadataCodec = t.type({
    image: t.union([t.undefined, t.string]),
    name: t.union([t.undefined, t.string]),
    description: t.union([t.undefined, t.string]),
    symbol: t.union([t.undefined, t.string])
});