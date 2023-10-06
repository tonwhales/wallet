import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { DomainSubkey } from "../legacy/products/ExtensionsProduct";

const collectionKey = 'domainKeys';

export type DomainKeysState = { [key: string]: DomainSubkey | undefined };

function mapStringToDomainKeysState(value: string | undefined): DomainKeysState {
    if (!value) {
        return {};
    }

    let parsed = JSON.parse(value);

    Object.keys(parsed).forEach((key) => {
        if (parsed[key]) {
            parsed[key] = {
                time: parsed[key].time,
                signature: Buffer.from(parsed[key].signature, 'base64'),
                secret: Buffer.from(parsed[key].secret, 'base64')
            };
        }
    });


    return parsed;
}

export function getDomainKeysState() {
    const stored = storagePersistence.getString(collectionKey);
    return mapStringToDomainKeysState(stored);
}

function storeDomainKeys(state: DomainKeysState) {
    const mapped = Object.keys(state).reduce((acc, key) => {
        if (state[key]) {
            acc[key] = {
                time: state[key]!.time,
                signature: state[key]!.signature.toString('base64'),
                secret: state[key]!.secret.toString('base64')
            };
        }
        return acc;
    }, {} as { [key: string]: { time: number, signature: string, secret: string } | undefined });
    storagePersistence.set(collectionKey, JSON.stringify(mapped));
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