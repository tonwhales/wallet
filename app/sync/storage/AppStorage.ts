import { Address } from 'ton';
import { LazyMap } from '../../utils/LazyMap';
import { FullAccount } from '../account/AccountFullSync';
import { LiteAccount } from '../account/AccountLiteAtom';
import { PluginState } from '../account/PluginSync';
import { StakingPoolState } from '../account/StakingPoolSync';
import { WalletV4State } from '../account/WalletV4Sync';
import { PersistedValue } from '../atom/PersistedValue';
import { Engine } from "../Engine";
import { JettonMasterState } from '../jettons/JettonMasterSync';
import { JettonsState } from '../jettons/JettonsSync';
import { JettonWalletState } from '../jettons/JettonWalletSync';
import { ContractMetadata } from '../metadata/Metadata';

export class AppStorage {

    readonly engine: Engine;
    readonly recoilUpdater: (node: any, value: any) => void;
    readonly #metadataCache: LazyMap<string, PersistedValue<ContractMetadata>>;
    readonly #liteAccountCache: LazyMap<string, PersistedValue<LiteAccount>>;
    readonly #fullAccountCache: LazyMap<string, PersistedValue<FullAccount>>;
    readonly #pluginCache: LazyMap<string, PersistedValue<PluginState>>;
    readonly #staking: LazyMap<string, PersistedValue<StakingPoolState>>;
    readonly #wallet: LazyMap<string, PersistedValue<WalletV4State>>;
    readonly #jettons: LazyMap<string, PersistedValue<JettonsState>>;
    readonly #jettonWallet: LazyMap<string, PersistedValue<JettonWalletState>>;
    readonly #jettonMaster: LazyMap<string, PersistedValue<JettonMasterState>>;
    readonly #downloads: LazyMap<string, PersistedValue<string>>;

    constructor(engine: Engine, recoilUpdater: (node: any, value: any) => void) {
        this.engine = engine;
        this.recoilUpdater = recoilUpdater;

        this.#metadataCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('metadata/' + src, engine.persistence.metadata.item(address), this, []);
        });
        this.#liteAccountCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/lite/' + src, engine.persistence.liteAccounts.item(address), this, []);
        });
        this.#fullAccountCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/full/' + src, engine.persistence.fullAccounts.item(address), this, []);
        });
        this.#pluginCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/plugin/' + src, engine.persistence.plugins.item(address), this, []);
        });
        this.#staking = new LazyMap((src) => {
            let parts = src.split('#');
            let address = Address.parse(parts[0]);
            let target = Address.parse(parts[1]);
            return new PersistedValue('staking/' + parts[0] + '/' + parts[1] + '/' + src, engine.persistence.staking.item({ address, target }), this, []);
        });
        this.#wallet = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/wallet/' + src, engine.persistence.wallets.item(address), this, []);
        });
        this.#jettons = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/jettons/' + src, engine.persistence.tokens.item(address), this, []);
        });
        this.#jettonWallet = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/jetton/wallet/' + src, engine.persistence.jettonWallets.item(address), this, []);
        });
        this.#jettonMaster = new LazyMap((src) => {
            let address = Address.parse(src);
            return new PersistedValue('account/jetton/master/' + src, engine.persistence.jettonMasters.item(address), this, []);
        });
        this.#downloads = new LazyMap((src) => {
            let v = new PersistedValue('file/' + src, engine.persistence.downloads.item(src), this, []);
            return v;
        });
    }

    wallet(pool: Address) {
        return this.#wallet.get(pool.toFriendly());
    }

    jettonWallet(address: Address) {
        return this.#jettonWallet.get(address.toFriendly());
    }

    jettonMaster(address: Address) {
        return this.#jettonMaster.get(address.toFriendly());
    }

    accountJettons(owner: Address) {
        return this.#jettons.get(owner.toFriendly());
    }

    staking(pool: Address, member: Address) {
        return this.#staking.get(pool.toFriendly() + '#' + member.toFriendly());
    }

    plugin(address: Address) {
        return this.#pluginCache.get(address.toFriendly());
    }

    metadata(address: Address) {
        return this.#metadataCache.get(address.toFriendly());
    }

    accountLite(address: Address) {
        return this.#liteAccountCache.get(address.toFriendly());
    }

    accountFull(address: Address) {
        return this.#fullAccountCache.get(address.toFriendly());
    }

    download(key: string) {
        if (key !== '') {
            setTimeout(() => { this.engine.accounts.getDownload(key); }, 10); // Create download lazily
        }
        return this.#downloads.get(key);
    }
}