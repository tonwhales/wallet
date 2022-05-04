import * as React from 'react';
import { MMKV } from "react-native-mmkv";
import { Address, TonClient4 } from "ton";
import { Connector } from "./Connector";
import { LegacyProduct } from './products/LegacyProduct';
import { PriceProduct } from './products/PriceProduct';
import { AppProduct } from './products/AppProduct';
import { StakingPoolProduct } from './products/StakingPoolProduct';
import { KnownPools } from '../utils/KnownPools';
import { IntrospectionEngine } from './introspection/IntrospectionEngine';
import { SubscriptionsProduct } from './products/SubscriptionsProduct';
import { BlocksWatcher } from './blocks/BlocksWatcher';
import { Accounts } from './account/Accounts';
import { Persistence } from './Persistence';
import { Transactions } from './transactions/Transactions';

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

    // Modules
    readonly products;
    readonly transactions: Transactions;
    readonly accounts: Accounts;
    readonly introspection: IntrospectionEngine;

    private _destroyed: boolean;
    private _dependencies: EngineProduct[] = [];

    constructor(
        address: Address,
        publicKey: Buffer,
        persistence: MMKV,
        client4Endpoint: string,
        connector: Connector
    ) {
        this.persistence = new Persistence(persistence);
        this.client4 = new TonClient4({ endpoint: 'https://' + client4Endpoint, timeout: 5000 });
        this.address = address;
        this.publicKey = publicKey;
        this.connector = connector;
        this._destroyed = false;
        this.introspection = new IntrospectionEngine(this);
        this.blocksWatcher = new BlocksWatcher(client4Endpoint);
        this.accounts = new Accounts(this);
        this.transactions = new Transactions(this);

        // Create products
        this.products = {
            main: this.accounts.getWalletSync(address),
            legacy: new LegacyProduct(this),
            price: new PriceProduct(this),
            apps: new AppProduct(this),
            whalesStakingPool: new StakingPoolProduct(this, KnownPools[0]),
        };
        this._dependencies.push(this.accounts);
        this._dependencies.push(this.products.main);
        this._dependencies.push(this.products.apps);
        this._dependencies.push(this.products.price);
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