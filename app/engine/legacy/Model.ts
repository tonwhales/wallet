import { Address } from 'ton';
import { LazyMap } from '../utils/LazyMap';
import { FullAccount } from './sync/startAccountFullSync';
import { LiteAccount } from './sync/startAccountLiteSync';
import { PluginState } from './sync/startPluginSync';
import { StakingPoolState } from './sync/startStakingPoolSync';
import { WalletV4State } from './sync/startWalletV4Sync';
import { PersistedItem } from './persistence/PersistedItem';
import { Engine } from "./Engine";
import { JettonMasterState } from './sync/startJettonMasterSync';
import { JettonWalletState } from './sync/startJettonWalletSync';
import { ContractMetadata } from './metadata/Metadata';

export class Model {

    readonly engine: Engine;
    readonly #metadataCache: LazyMap<string, PersistedItem<ContractMetadata>>;
    readonly #liteAccountCache: LazyMap<string, PersistedItem<LiteAccount>>;
    readonly #fullAccountCache: LazyMap<string, PersistedItem<FullAccount>>;
    readonly #pluginCache: LazyMap<string, PersistedItem<PluginState>>;
    readonly #staking: LazyMap<string, PersistedItem<StakingPoolState>>;
    readonly #wallet: LazyMap<string, PersistedItem<WalletV4State>>;
    readonly #jettonWallet: LazyMap<string, PersistedItem<JettonWalletState>>;
    readonly #jettonMaster: LazyMap<string, PersistedItem<JettonMasterState>>;
    readonly #downloads: LazyMap<string, PersistedItem<string>>;

    constructor(engine: Engine) {
        this.engine = engine;

        this.#metadataCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.metadata.item(address);
        });
        this.#liteAccountCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.liteAccounts.item(address);
        });
        this.#fullAccountCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.fullAccounts.item(address);
        });
        this.#pluginCache = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.plugins.item(address);
        });
        this.#staking = new LazyMap((src) => {
            let parts = src.split('#');
            let address = Address.parse(parts[0]);
            let target = Address.parse(parts[1]);
            return engine.persistence.staking.item({ address, target });
        });
        this.#wallet = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.wallets.item(address);
        });
        this.#jettonWallet = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.jettonWallets.item(address);
        });
        this.#jettonMaster = new LazyMap((src) => {
            let address = Address.parse(src);
            return engine.persistence.jettonMasters.item(address);
        });
        this.#downloads = new LazyMap((src) => {
            let v = engine.persistence.downloads.item(src);
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
        return this.#downloads.get(key);
    }
}