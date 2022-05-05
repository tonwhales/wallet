import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { log } from "../../utils/log";
import { Engine } from "../Engine";
import { tryGetJettonWallet } from "../metadata/introspections/tryGetJettonWallet";
import { TokensState } from "../Persistence";
import { FullAccount } from "./AccountFullSync";
import { Sync } from "./utils/Sync";

const TESTNET_COINS = [
    Address.parse('kQDBKeGhu9nkQ6jDqkBM9PKxBhGPLEK9Zzj-R2eP8jXK-8Pk')
];
const MAINNET_COINS = [
    Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')
];

export class TokenSync extends Sync<Address, TokensState> {

    readonly engine: Engine;

    #fullAccount: FullAccount | null = null;
    #address: Address;

    constructor(engine: Engine, address: Address) {
        super({ key: address, collection: engine.persistence.tokens });
        this.engine = engine;
        this.#address = address;

        let fullSync = engine.accounts.getFullSyncForAddress(address);
        if (fullSync.ready) {
            this.#fullAccount = fullSync.state;
            this.invalidate();
        }
        fullSync.on('account_ready', (data) => {
            this.#fullAccount = data.state;
            this.invalidate();
        });
        fullSync.on('account_updated', (data) => {
            this.#fullAccount = data.state;
            this.invalidate();
        });
        this.invalidate();
    }

    getWallets() {
        let addrs: Address[] = [];
        for (let k in this.state.tokens) {
            addrs.push(Address.parse(this.state.tokens[k]));
        }
        return addrs;
    }

    async doSync(key: Address, current: TokensState | null): Promise<TokensState | null> {

        // Ignore if not loaded
        if (!this.#fullAccount) {
            return null;
        }
        let acc = this.#fullAccount;

        log('[tokens]: Synching');

        // Collect tokens
        let tokens: { [key: string]: string } = {};
        let pending = new Set<string>();

        // Collect referenced transactions
        let mentioned = new Set<string>();
        for (let t of acc.transactions) {
            let tx = this.engine.transactions.get(key, t);
            if (tx.inMessage && tx.inMessage.info.src) {
                mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
            for (let out of tx.outMessages) {
                if (out.info.dest) {
                    mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                }
            }
        }

        // Process metadata (already downloaded by parent sync)
        for (let m of mentioned) {
            let md = this.engine.metadata.getMetadata(Address.parse(m));
            if (md.jettonMaster) {
                if (!pending.has(m) && !tokens[m]) {
                    log(`[tokens]: registered ${m}`);
                    pending.add(m);
                }
            }
            if (md.jettonWallet) {
                let kkl = md.jettonWallet.master.toFriendly({ testOnly: AppConfig.isTestnet });
                if (!pending.has(kkl) && !tokens[kkl]) {
                    log(`[tokens]: registered ${kkl}`);
                    pending.add(kkl);
                }
            }
        }

        // Process whitelisted
        if (!AppConfig.isTestnet) {
            for (let a of MAINNET_COINS) {
                let k = a.toFriendly({ testOnly: AppConfig.isTestnet });
                if (!pending.has(k) && !tokens[k]) {
                    log(`[tokens]: registered ${k}`);
                    pending.add(k);
                }
            }
        } else {
            for (let a of TESTNET_COINS) {
                let k = a.toFriendly({ testOnly: AppConfig.isTestnet });
                if (!pending.has(k) && !tokens[k]) {
                    log(`[tokens]: registered ${k}`);
                    pending.add(k);
                }
            }
        }

        // Resolve wallets
        for (let p of pending) {
            let master = Address.parse(p);
            let metadata = await this.engine.metadata.prepareMetadata(this.#fullAccount.block, master);
            if (metadata.jettonMaster) {
                let wallet = await tryGetJettonWallet(this.engine.client4, acc.block, { address: this.#address, master });
                if (!wallet) {
                    tokens[p] = '';
                } else {
                    tokens[p] = wallet.toFriendly({ testOnly: AppConfig.isTestnet });
                }
            } else {
                tokens[p] = '';
            }
        }

        return { tokens };
    }
}