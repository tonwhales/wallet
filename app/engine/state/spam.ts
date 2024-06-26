import { atom } from "recoil";
import { storage, storagePersistence } from "../../storage/storage";
import { toNano } from "@ton/core";

const minAmountKey = 'spamMinAmount';

function getMinAmountState(): bigint {
    const stored = storagePersistence.getString(minAmountKey);
    if (!!stored) {
        try {
            return BigInt(stored);
        } catch (e) {
            return toNano('0.05');
        }
    }
    return toNano('0.05');
}

function storeMinAmountState(value: bigint) {
    storagePersistence.set(minAmountKey, value.toString());
}

export const minAmountState = atom<bigint>({
    key: 'spam/minAmount',
    default: getMinAmountState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeMinAmountState(newValue);
        })
    }]
});

const dontShowCommentsKey = 'dontShowComments';

function getDontShowCommentsState(): boolean {
    const stored = storagePersistence.getBoolean(dontShowCommentsKey);
    if (!!stored) {
        return stored;
    }
    return true;
}

function storeDontShowCommentsState(value: boolean) {
    storagePersistence.set(dontShowCommentsKey, value);
}


// 2.3.8 Migration to not show spam comments by default
const migrationKey = '2.3.8spamComments';

export function migrateDontShowComments() {
    const migrated = storage.getBoolean(migrationKey);

    if (!migrated) {
        storagePersistence.set(dontShowCommentsKey, true);
        storage.set(migrationKey, true);
    }
}

export const dontShowCommentsState = atom<boolean>({
    key: 'spam/dontShowComments',
    default: getDontShowCommentsState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeDontShowCommentsState(newValue);
        })
    }]
});