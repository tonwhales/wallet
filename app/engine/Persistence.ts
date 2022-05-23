import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { PersistedCollection } from "./persistence/PersistedCollection";
import * as t from 'io-ts';
import * as c from './utils/codecs';
import BN from "bn.js";
import { ContractMetadata } from "./metadata/Metadata";
import { PluginState } from "./sync/startPluginSync";
import { LiteAccount } from "./sync/startAccountLiteSync";
import { FullAccount } from "./sync/startAccountFullSync";
import { WalletV4State } from "./sync/startWalletV4Sync";
import { JettonWalletState } from "./sync/startJettonWalletSync";
import { JettonMasterState } from "./sync/startJettonMasterSync";
import { StakingPoolState } from "./sync/startStakingPoolSync";
import { Engine } from "./Engine";
import { HintProcessingState } from "./sync/startHintSync";
import { TxHints } from "./sync/startHintsTxSync";
import { ConfigState } from "./sync/startConfigSync";

export class Persistence {

    readonly version: number = 3;
    readonly liteAccounts: PersistedCollection<Address, LiteAccount>;
    readonly fullAccounts: PersistedCollection<Address, FullAccount>;
    readonly transactions: PersistedCollection<{ address: Address, lt: BN }, string>;
    readonly wallets: PersistedCollection<Address, WalletV4State>;
    readonly smartCursors: PersistedCollection<{ key: string, address: Address }, number>;
    readonly prices: PersistedCollection<void, { price: { usd: number } }>;
    readonly apps: PersistedCollection<Address, string>;
    readonly staking: PersistedCollection<{ address: Address, target: Address }, StakingPoolState>;
    readonly metadata: PersistedCollection<Address, ContractMetadata>;
    readonly metadataPending: PersistedCollection<void, { [key: string]: number }>;
    readonly plugins: PersistedCollection<Address, PluginState>;

    readonly jettonWallets: PersistedCollection<Address, JettonWalletState>;
    readonly jettonMasters: PersistedCollection<Address, JettonMasterState>;
    readonly knownJettons: PersistedCollection<void, Address[]>;
    readonly knownAccountJettons: PersistedCollection<Address, Address[]>;

    readonly downloads: PersistedCollection<string, string>;
    readonly hintState: PersistedCollection<Address, HintProcessingState>;
    readonly hintRequest: PersistedCollection<Address, number>;
    readonly accountHints: PersistedCollection<Address, Address[]>;
    readonly scannerState: PersistedCollection<Address, TxHints>;

    readonly config: PersistedCollection<void, ConfigState>;

    constructor(storage: MMKV, engine: Engine) {
        if (storage.getNumber('storage-version') !== this.version) {
            storage.clearAll();
            storage.set('storage-version', this.version);
        }
        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec, engine });
        this.fullAccounts = new PersistedCollection({ storage, namespace: 'fullAccounts', key: addressKey, codec: fullAccountCodec, engine });
        this.wallets = new PersistedCollection({ storage, namespace: 'wallets', key: addressKey, codec: walletCodec, engine });
        this.transactions = new PersistedCollection({ storage, namespace: 'transactions', key: transactionKey, codec: t.string, engine });
        this.smartCursors = new PersistedCollection({ storage, namespace: 'cursors', key: keyedAddressKey, codec: t.number, engine });
        this.prices = new PersistedCollection({ storage, namespace: 'prices', key: voidKey, codec: priceCodec, engine });
        this.apps = new PersistedCollection({ storage, namespace: 'apps', key: addressKey, codec: t.string, engine });
        this.staking = new PersistedCollection({ storage, namespace: 'staking', key: addressWithTargetKey, codec: stakingPoolStateCodec, engine });
        this.metadata = new PersistedCollection({ storage, namespace: 'metadata', key: addressKey, codec: metadataCodec, engine });
        this.metadataPending = new PersistedCollection({ storage, namespace: 'metadataPending', key: voidKey, codec: codecPendingMetadata, engine });
        this.plugins = new PersistedCollection({ storage, namespace: 'plugins', key: addressKey, codec: pluginStateCodec, engine });
        this.downloads = new PersistedCollection({ storage, namespace: 'downloads', key: stringKey, codec: t.string, engine });

        // Hints
        this.hintState = new PersistedCollection({ storage, namespace: 'hintState', key: addressKey, codec: hintProcessingState, engine });
        this.hintRequest = new PersistedCollection({ storage, namespace: 'hintRequest', key: addressKey, codec: t.number, engine });
        this.accountHints = new PersistedCollection({ storage, namespace: 'hintsAccount', key: addressKey, codec: t.array(c.address), engine });
        this.scannerState = new PersistedCollection({ storage, namespace: 'hintsScanner', key: addressKey, codec: hintScannerCodec, engine });

        // Jettons
        this.jettonWallets = new PersistedCollection({ storage, namespace: 'jettonWallets', key: addressKey, codec: jettonWalletCodec, engine });
        this.jettonMasters = new PersistedCollection({ storage, namespace: 'jettonMasters', key: addressKey, codec: jettonMasterCodec, engine });
        this.knownJettons = new PersistedCollection({ storage, namespace: 'knownJettons', key: voidKey, codec: t.array(c.address), engine });
        this.knownAccountJettons = new PersistedCollection({ storage, namespace: 'knownAccountJettons', key: addressKey, codec: t.array(c.address), engine });

        this.config = new PersistedCollection({ storage, namespace: 'config', key: voidKey, codec: configCodec, engine });
    }
}

// Key formats
const addressKey = (src: Address) => src.toFriendly({ testOnly: AppConfig.isTestnet });
const addressWithTargetKey = (src: { address: Address, target: Address }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.target.toFriendly({ testOnly: AppConfig.isTestnet });
const transactionKey = (src: { address: Address, lt: BN }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.lt.toString(10);
const keyedAddressKey = (src: { address: Address, key: string }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.key;
const voidKey = (src: void) => 'void';
const stringKey = (src: string) => Buffer.from(src).toString('base64');

// Codecs
const liteAccountCodec = t.type({
    balance: c.bignum,
    block: t.number,
    last: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),
    storageStats: t.union([t.null, t.type({
        lastPaid: t.number,
        duePayment: t.union([t.null, t.string]),
        used: t.type({
            bits: t.number,
            cells: t.number,
            publicCells: t.number
        })
    })])
});
const fullAccountCodec = t.type({
    balance: c.bignum,
    block: t.number,
    last: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),

    transactionsCursor: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),
    transactions: t.array(t.string)
});
const walletCodec = t.type({
    seqno: t.number,
    block: t.number,
    balance: c.bignum,
    plugins: t.array(c.address),
    transactions: t.array(t.string)
});
const priceCodec = t.type({
    price: t.type({
        usd: t.number
    })
});
const stakingPoolStateCodec = t.type({
    lt: c.bignum,
    params: t.type({
        minStake: c.bignum,
        depositFee: c.bignum,
        withdrawFee: c.bignum,
        stakeUntil: t.number,
        receiptPrice: c.bignum
    }),
    member: t.type({
        balance: c.bignum,
        pendingDeposit: c.bignum,
        pendingWithdraw: c.bignum,
        withdraw: c.bignum
    })
});

const contentSourceCodec = t.type({
    type: t.literal('offchain'),
    link: t.string
});
const metadataCodec = t.type({
    seqno: t.number,
    interfaces: t.array(t.string),
    jettonWallet: t.union([t.undefined, t.type({
        balance: c.bignum,
        owner: c.address,
        master: c.address,
    })]),
    jettonMaster: t.union([t.undefined, t.type({
        totalSupply: c.bignum,
        mintalbe: t.boolean,
        owner: c.address,
        content: t.union([t.undefined, contentSourceCodec])
    })])
});

const codecPendingMetadata = t.record(t.string, t.number);

const pluginStateCodec = t.union([t.type({
    type: t.literal('unknown'),
}), t.type({
    type: t.literal('legacy-subscription'),
    state: t.type({
        wallet: c.address,
        beneficiary: c.address,
        amount: c.bignum,
        period: t.number,
        startAt: t.number,
        timeout: t.number,
        lastPayment: t.number,
        lastRequest: t.number,
        failedAttempts: t.number,
        subscriptionId: t.string
    })
})]);

const jettonWalletCodec = t.type({
    block: t.number,
    master: t.union([t.null, c.address]),
    balance: c.bignum
});

const jettonMasterCodec = t.type({
    version: t.number,
    name: t.union([t.null, t.string]),
    description: t.union([t.null, t.string]),
    image: t.union([t.null, t.string]),
    symbol: t.union([t.null, t.string])
});

const hintProcessingState = t.type({
    version: t.number,
    seqno: t.number
});
const hintScannerCodec = t.type({
    min: c.bignum,
    max: c.bignum
});

const chainConfigCodec = t.type({
    gas: t.type({
        flatLimit: c.bignum,
        flatGasPrice: c.bignum,
        price: c.bignum,
    }),
    message: t.type({
        lumpPrice: c.bignum,
        bitPrice: c.bignum,
        cellPrice: c.bignum,
        firstFrac: c.bignum
    })
})

const configCodec = t.type({
    storage: t.array(t.type({
        utime_since: c.bignum,
        bit_price_ps: c.bignum,
        cell_price_ps: c.bignum,
        mc_bit_price_ps: c.bignum,
        mc_cell_price_ps: c.bignum
    })),
    workchain: chainConfigCodec,
    masterchain: chainConfigCodec
});