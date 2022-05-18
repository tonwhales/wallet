import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { log } from "../../utils/log";
import { AccountFullSync } from "../account/AccountFullSync";
import { Engine } from "../Engine";
import { tryGetJettonWallet } from "../metadata/introspections/tryGetJettonWallet";
import { useItem } from "../persistence/PersistedItem";
import { PersistedValueSync } from "../persistence/PersistedValueSync";
import { SyncCollection } from "../utils/SyncCollection";
import { JettonMasterState, JettonMasterSync } from "./JettonMasterSync";
import { JettonWalletState, JettonWalletSync } from "./JettonWalletSync";

export type JettonsState = {
    tokens: { [key: string]: string | null };
};

export class JettonsSync extends PersistedValueSync<JettonsState> {
    readonly address: Address;
    readonly parent: AccountFullSync;
    readonly engine: Engine;
    readonly wallets = new SyncCollection<JettonWalletState>();
    readonly masters = new SyncCollection<JettonMasterState>();

    constructor(parent: AccountFullSync) {
        super('jettons', parent.engine.storage.accountJettons(parent.address), parent.engine);

        this.engine = parent.engine;
        this.address = parent.address;
        this.parent = parent;

        // Forward parent
        if (parent.ready) {
            this.invalidate();
        }
        parent.ref.on('ready', () => {
            this.invalidate();
        });
        parent.ref.on('updated', () => {
            this.invalidate();
        });

        // Collections
        this.ref.on('ready', (data) => {
            this.applyWallets(data);
        });
        this.ref.on('updated', (data) => {
            this.applyWallets(data);
        });
        if (this.ref.ready) {
            this.applyWallets(this.ref.value);
        }
    }

    useState() {
        let map = useItem(this.engine.storage.accountJettons(this.address));
        let wallets = this.wallets.use();
        let masters = this.masters.use();

        let tokens: { master: string, wallet: string, name: string, description: string, image: string | null, symbol: string, balance: BN }[] = [];
        for (let ms in map.tokens) {
            let wl = map.tokens[ms];

            if (!masters[ms] || !masters[ms].name || !masters[ms].description || !masters[ms].symbol) {
                continue;
            }
            if (!wl || !wallets[wl]) {
                continue;
            }

            tokens.push({
                master: ms,
                wallet: wl,
                name: masters[ms].name!,
                description: masters[ms].description!,
                balance: wallets[wl].balance,
                symbol: masters[ms].symbol!,
                image: masters[ms].image
            });
        }
        return tokens;
    }

    protected applyWallets = (src: JettonsState) => {

        // Add tokens
        for (let k in src.tokens) {
            let v = src.tokens[k];
            if (!!v) {
                if (!this.wallets.has(v)) {
                    this.wallets.add(v, new JettonWalletSync(this.engine.accounts.getLiteSyncForAddress(Address.parse(v))));
                }
            }
            if (!this.masters.has(k)) {
                this.masters.add(k, new JettonMasterSync(Address.parse(k), this.engine));
            }
        }

        // TODO: Apply
    }

    protected doSync = async (src: JettonsState | null): Promise<JettonsState | null> => {

        // Parent value
        let acc = this.parent.current;
        if (!acc) {
            return null;
        }

        // Collect tokens
        let tokens: { [key: string]: string | null } = {};
        if (src) {
            tokens = { ...src.tokens };
        }
        let pending = new Set<string>();
        let skipped = new Set<string>();

        // Collect referenced addresses
        let mentioned = new Set<string>();
        for (let t of acc.transactions) {
            let tx = this.engine.transactions.get(this.address, t);
            if (tx.inMessage && tx.inMessage.info.src && !tx.inMessage.info.src.equals(this.address)) {
                mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
            for (let out of tx.outMessages) {
                if (out.info.dest && !out.info.dest.equals(this.address)) {
                    mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                }
            }
        }

        // Process metadata (already downloaded by parent sync)
        for (let m of mentioned) {
            let md = this.engine.storage.metadata(Address.parse(m)).value;
            if (md && md.jettonMaster) {
                if (!pending.has(m) && tokens[m] === undefined) {
                    log(`[tokens]: registered ${m}`);
                    pending.add(m);
                }
            } else {
                skipped.add(m);
            }
            if (md && md.jettonWallet) {
                let kkl = md.jettonWallet.master.toFriendly({ testOnly: AppConfig.isTestnet });
                if (!pending.has(kkl) && tokens[kkl] === undefined) {
                    log(`[tokens]: registered ${kkl}`);
                    pending.add(kkl);
                }
            }
        }

        // Resolve wallets
        for (let p of pending) {
            let master = Address.parse(p);
            let metadata = await this.engine.metadata.prepareMetadata(acc.block, master);
            if (metadata.jettonMaster) {
                let wallet = await tryGetJettonWallet(this.engine.client4, acc.block, { address: this.address, master });
                if (!wallet) {
                    tokens[p] = null;
                } else {
                    tokens[p] = wallet.toFriendly({ testOnly: AppConfig.isTestnet });
                }
            } else {
                tokens[p] = null;
            }
        }

        return { tokens };
    };
}