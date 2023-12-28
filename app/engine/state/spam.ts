import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { toNano } from "@ton/core";

const minAmountKey = 'spamMinAmount';

function getMinAmountState(): bigint {
    const stored  = storagePersistence.getString(minAmountKey);
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
    const stored  = storagePersistence.getBoolean(dontShowCommentsKey);
    if (!!stored) {
        return stored;
    }
    return false;
}

function storeDontShowCommentsState(value: boolean) {
    storagePersistence.set(dontShowCommentsKey, value);
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