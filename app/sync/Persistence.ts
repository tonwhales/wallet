import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { PersistedCollection } from "./PersistedCollection";
import * as t from 'io-ts';

export type LiteAccountPersisted = {
    balance: string;
    last: { lt: string, hash: string } | null,
    seqno: number;
}

export class Persistence {

    readonly liteAccounts: PersistedCollection<Address, LiteAccountPersisted>;

    constructor(storage: MMKV) {
        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec })
    }
}

// Key formats
const addressKey = (src: Address) => src.toFriendly({ testOnly: AppConfig.isTestnet });
const transactionKey = (src: Address, lt: string) => src.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + lt;

// Codecs
const liteAccountCodec = t.type({
    balance: t.string,
    seqno: t.number,
    last: t.union([t.null, t.type({ lt: t.string, hash: t.string })])
});
