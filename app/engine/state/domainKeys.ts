import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { DomainSubkey } from "../legacy/products/ExtensionsProduct";

const collectionKey = 'domainKeys';

export type DomainKeysState = { [key: string]: DomainSubkey | undefined };

export function getDomainKeysState() {
    const stored = storagePersistence.getString(collectionKey);

    if (!stored) {
        return {};
    }

    return JSON.parse(stored) as DomainKeysState;
}

function storeDomainKeys(state: DomainKeysState) {
    storagePersistence.set(collectionKey, JSON.stringify(state));
}

export const domainKeys = atom<DomainKeysState>({
    key: 'domainKeys',
    default: getDomainKeysState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeDomainKeys(newValue);
        })
    }]
});