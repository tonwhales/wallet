import * as React from 'react';
import { MMKV } from "react-native-mmkv";
import { Address, TonClient4 } from "ton";
import { Connector } from "../api/Connector";
import { LegacyProduct } from './products/LegacyProduct';
import { PriceProduct } from './products/PriceProduct';
import { AppProduct } from './products/AppProduct';
import { BlocksWatcher } from '../blocks/BlocksWatcher';
import { Persistence } from './Persistence';
import { Transactions } from './transactions/Transactions';
import { SyncStateManager } from './SyncStateManager';
import { WalletProduct } from './products/WalletProduct';
import { Model } from './Model';
import { startSync } from './sync/startSync';
import { ConfigProduct } from './products/ConfigProduct';
import { ServerConfigProduct } from './products/ServerConfigProduct';
import { ExtensionsProduct } from './products/ExtensionsProduct';
import { Cloud } from './cloud/Cloud';
import { StakingPoolsProduct } from './products/StakingProduct';
import { SettingsProduct } from './products/SettingsProduct';
import { KeysProduct } from './legacy/keys/KeysProduct';
import { HoldersProduct } from './holders/HoldersProduct';
import { ConnectProduct } from './products/ConnectProduct';
import { LedgerProduct } from './products/LedgerProduct';

export type RecoilInterface = {
    updater: (node: any, value: any) => void;
}

export class Engine {
    readonly isTestnet: boolean;
    // Config
    readonly address: Address;
    readonly publicKey: Buffer;

    // Storage
    readonly persistence: Persistence;
    readonly cloud: Cloud

    // Connector
    readonly connector: Connector;
    readonly client4: TonClient4;
    readonly blocksWatcher: BlocksWatcher;
    readonly state: SyncStateManager = new SyncStateManager();

    // Modules
    readonly products: {
        main: WalletProduct,
        legacy: LegacyProduct,
        price: PriceProduct,
        apps: AppProduct,
        whalesStakingPools: StakingPoolsProduct,
        config: ConfigProduct,
        serverConfig: ServerConfigProduct,
        extensions: ExtensionsProduct,
        settings: SettingsProduct,
        keys: KeysProduct,
        tonConnect: ConnectProduct,
        ledger: LedgerProduct,
        holders: HoldersProduct
    };
    readonly transactions: Transactions;
    readonly model: Model;
    readonly recoil: RecoilInterface;
    private _destroyed: boolean;

    constructor(
        address: Address,
        publicKey: Buffer,
        utilityKey: Buffer,
        persistence: MMKV,
        client4Endpoint: string,
        connector: Connector,
        recoil: RecoilInterface,
        isTestnet: boolean
    ) {
        this.recoil = recoil;
        this.persistence = new Persistence(persistence, this);
        this.client4 = new TonClient4({ endpoint: 'https://' + client4Endpoint, timeout: 5000 });
        this.address = address;
        this.publicKey = publicKey;
        this.connector = connector;
        this._destroyed = false;
        this.model = new Model(this);
        this.blocksWatcher = new BlocksWatcher(client4Endpoint, this.state);
        this.transactions = new Transactions(this);
        this.cloud = new Cloud(this, utilityKey);
        this.isTestnet = isTestnet;

        //
        // Create products
        //

        this.products = {
            main: new WalletProduct(this),
            legacy: new LegacyProduct(this),
            price: new PriceProduct(this),
            apps: new AppProduct(this),
            whalesStakingPools: new StakingPoolsProduct(this),
            config: new ConfigProduct(this),
            serverConfig: new ServerConfigProduct(this),
            extensions: new ExtensionsProduct(this),
            settings: new SettingsProduct(this),
            keys: new KeysProduct(this),
            tonConnect: new ConnectProduct(this),
            ledger: new LedgerProduct(this),
            holders: new HoldersProduct(this)
        };

        //
        // Start sync
        //

        startSync(this);

        //
        // Declare dependencies
        //

        // this._dependencies.push(this.sync);
        // this._dependencies.push(this.products.main);
        // this._dependencies.push(this.products.price);
        // this._dependencies.push(this.products.whalesStakingPool);
    }

    get ready() {
        return true;
    }

    async awaitReady() {
        // Nothing await
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this.blocksWatcher.stop();
        }
    }
}

// Context
export const EngineContext = React.createContext<Engine | null>(null);

export function useEngine(): Engine {
    return React.useContext(EngineContext)!;
}