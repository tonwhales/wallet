import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { PersistedCollection } from "./PersistedCollection";
import * as t from 'io-ts';
import * as c from './utils/codecs';
import BN from "bn.js";
import { ContractMetadata } from "./metadata/Metadata";
import { PluginState } from "./account/PluginSync";
import { LiteAccount } from "./account/AccountLiteAtom";
import { FullAccount } from "./account/AccountFullSync";
import { WalletV4State } from "./account/WalletV4Sync";
import { JettonsState } from "./jettons/JettonsSync";
import { JettonWalletState } from "./jettons/JettonWalletSync";
import { JettonMasterState } from "./jettons/JettonMasterSync";
import { StakingPoolState } from "./account/StakingPoolSync";

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
    readonly tokens: PersistedCollection<Address, JettonsState>;
    readonly jettonWallets: PersistedCollection<Address, JettonWalletState>;
    readonly jettonMasters: PersistedCollection<Address, JettonMasterState>;

    constructor(storage: MMKV) {
        if (storage.getNumber('storage-version') !== this.version) {
            storage.clearAll();
            storage.set('storage-version', this.version);
        }
        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec });
        this.fullAccounts = new PersistedCollection({ storage, namespace: 'fullAccounts', key: addressKey, codec: fullAccountCodec });
        this.wallets = new PersistedCollection({ storage, namespace: 'wallets', key: addressKey, codec: walletCodec });
        this.transactions = new PersistedCollection({ storage, namespace: 'transactions', key: transactionKey, codec: t.string });
        this.smartCursors = new PersistedCollection({ storage, namespace: 'cursors', key: keyedAddressKey, codec: t.number });
        this.prices = new PersistedCollection({ storage, namespace: 'prices', key: voidKey, codec: priceCodec });
        this.apps = new PersistedCollection({ storage, namespace: 'apps', key: addressKey, codec: t.string });
        this.staking = new PersistedCollection({ storage, namespace: 'staking', key: addressWithTargetKey, codec: stakingPoolStateCodec });
        this.metadata = new PersistedCollection({ storage, namespace: 'metadata', key: addressKey, codec: metadataCodec });
        this.metadataPending = new PersistedCollection({ storage, namespace: 'metadataPending', key: voidKey, codec: codecPendingMetadata });
        this.plugins = new PersistedCollection({ storage, namespace: 'plugins', key: addressKey, codec: pluginStateCodec });
        this.jettonWallets = new PersistedCollection({ storage, namespace: 'jettonWallets', key: addressKey, codec: jettonWalletCodec });
        this.jettonMasters = new PersistedCollection({ storage, namespace: 'jettonMasters', key: addressKey, codec: jettonMasterCodec });
        this.tokens = new PersistedCollection({ storage, namespace: 'jettonWallets', key: addressKey, codec: tokensCodec });
    }
}

// Key formats
const addressKey = (src: Address) => src.toFriendly({ testOnly: AppConfig.isTestnet });
const addressWithTargetKey = (src: { address: Address, target: Address }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.target.toFriendly({ testOnly: AppConfig.isTestnet });
const transactionKey = (src: { address: Address, lt: BN }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.lt.toString(10);
const keyedAddressKey = (src: { address: Address, key: string }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.key;
const voidKey = (src: void) => 'void';

// Codecs
const liteAccountCodec = t.type({
    balance: c.bignum,
    block: t.number,
    last: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })])
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
    name: t.union([t.null, t.string]),
    description: t.union([t.null, t.string]),
    image: t.union([t.null, t.string]),
    symbol: t.union([t.null, t.string])
});

const tokensCodec = t.type({
    tokens: t.record(t.string, t.union([t.string, t.null]))
});