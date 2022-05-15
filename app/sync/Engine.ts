import * as React from 'react';
import { MMKV } from "react-native-mmkv";
import { Address, TonClient4 } from "ton";
import { Connector } from "./api/Connector";
import { LegacyProduct } from './products/LegacyProduct';
import { PriceProduct } from './products/PriceProduct';
import { AppProduct } from './products/AppProduct';
import { StakingPoolProduct } from './products/StakingPoolProduct';
import { KnownPools } from '../utils/KnownPools';
import { MetadataEngine } from './metadata/MetadataEngine';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { Accounts } from './account/Accounts';
import { Persistence } from './Persistence';
import { Transactions } from './transactions/Transactions';
import { SyncStateManager } from './SyncStateManager';
import { WalletV4Sync } from './account/WalletV4Sync';
import { WalletSync } from './account/WalletSync';
import { AppStorage } from './storage/AppStorage';
import { Downloads } from './files/Downloads';

export type EngineProduct = {
    ready: boolean,
    awaitReady: () => Promise<void>
}

export class Engine {
    // Config
    readonly address: Address;
    readonly publicKey: Buffer;

    // Storage
    readonly persistence: Persistence;

    // Connector
    readonly connector: Connector;
    readonly client4: TonClient4;
    readonly blocksWatcher: BlocksWatcher;
    readonly state: SyncStateManager = new SyncStateManager();
    readonly downloads: Downloads;

    // Modules
    readonly products;
    readonly transactions: Transactions;
    readonly accounts: Accounts;
    readonly metadata: MetadataEngine;
    readonly storage: AppStorage;

    private _destroyed: boolean;
    private _dependencies: EngineProduct[] = [];

    constructor(
        address: Address,
        publicKey: Buffer,
        persistence: MMKV,
        client4Endpoint: string,
        connector: Connector,
        recoilUpdater: (node: any, value: any) => void
    ) {
        this.persistence = new Persistence(persistence);
        this.client4 = new TonClient4({ endpoint: 'https://' + client4Endpoint, timeout: 5000 });
        this.address = address;
        this.publicKey = publicKey;
        this.connector = connector;
        this._destroyed = false;
        this.storage = new AppStorage(this, recoilUpdater);
        this.metadata = new MetadataEngine(this);
        this.blocksWatcher = new BlocksWatcher(client4Endpoint, this.state);
        this.accounts = new Accounts(this);
        this.transactions = new Transactions(this);
        this.downloads = new Downloads(this);

        // Create products
        this.products = {
            main: new WalletSync(new WalletV4Sync(this.accounts.getFullSyncForAddress(this.address))),
            legacy: new LegacyProduct(this),
            price: new PriceProduct(this),
            apps: new AppProduct(this),
            whalesStakingPool: new StakingPoolProduct(this, KnownPools[0]),
        };
        this._dependencies.push(this.accounts);
        this._dependencies.push(this.products.main);
        this._dependencies.push(this.products.price);
        this._dependencies.push(this.products.legacy);
        this._dependencies.push(this.products.whalesStakingPool);
    }

    get ready() {
        for (let p of this._dependencies) {
            if (!p.ready) {
                return false;
            }
        }
        return true;
    }

    async awaitReady() {
        for (let p of this._dependencies) {
            if (!p.ready) {
                await p.awaitReady();
            }
        }
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