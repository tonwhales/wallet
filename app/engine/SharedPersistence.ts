import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { PersistedCollection } from "./persistence/PersistedCollection";
import * as t from 'io-ts';
import { Engine } from "./Engine";
import { WalletSettings } from "./products/WalletsProduct";

export class SharedPersistence {
    readonly version: number = 1;
    readonly walletSettings: PersistedCollection<Address, WalletSettings>;

    constructor(sharedStorage: MMKV, engine: Engine) {
        if (sharedStorage.getNumber('storage-version') !== this.version) {
            sharedStorage.clearAll();
            sharedStorage.set('storage-version', this.version);
        }

        // Key formats
        const addressKey = (src: Address) => src.toFriendly({ testOnly: engine.isTestnet });

        this.walletSettings = new PersistedCollection({ storage: sharedStorage, namespace: 'walletSettings', key: addressKey, codec: t.type({ name: nullableString, avatar: nullableNumber }), engine });
    }
}

// Codecs
const nullableString = t.union([t.string, t.null]);
const nullableNumber = t.union([t.number, t.null]);