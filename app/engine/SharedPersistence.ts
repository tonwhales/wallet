import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import * as t from 'io-ts';
import { WalletSettings } from "./products/WalletsProduct";
import { SharedPersistedCollection } from "./persistence/SharedPersistedCollection";

export class SharedPersistence {
    readonly version: number = 1;
    readonly walletSettings: SharedPersistedCollection<Address, WalletSettings>;
    readonly lockAppWithAuth: SharedPersistedCollection<void, boolean>;

    constructor(sharedStorage: MMKV, recoil: { updater: (node: any, value: any) => void }, isTestnet: boolean) {
        if (sharedStorage.getNumber('storage-version') !== this.version) {
            sharedStorage.clearAll();
            sharedStorage.set('storage-version', this.version);
        }

        // Key formats
        const addressKey = (src: Address) => src.toFriendly({ testOnly: isTestnet });
        const voidKey = (src: void) => 'void';

        this.walletSettings = new SharedPersistedCollection({ storage: sharedStorage, namespace: 'walletSettings', key: addressKey, codec: t.type({ name: nullableString, avatar: nullableNumber }), recoil });
        this.lockAppWithAuth = new SharedPersistedCollection({ storage: sharedStorage, namespace: 'lockAppWithAuth', key: voidKey, codec: t.boolean, recoil });
    }
}

// Codecs
const nullableString = t.union([t.string, t.null]);
const nullableNumber = t.union([t.number, t.null]);