import { selector } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { selectedAccountSelector } from "./appState";
import { Address } from "@ton/core";
import { getCurrentAddress } from "../../storage/appState";

const collectionKey = 'domainKeys';

export type DomainSubkey = { time: number, signature: Buffer, secret: Buffer };
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

export function getDomainKeysState(address?: Address) {
    if (!address) {
        return {};
    }
    const stored = storagePersistence.getString(`${address.toString()}/${collectionKey}`);
    return mapStringToDomainKeysState(stored);
}

export function clearDomainKeysState(address: Address) {
    storagePersistence.delete(`${address.toString()}/${collectionKey}`);
}

export function getDomainKey(domain: string) {
    const selected = getCurrentAddress();
    const state = getDomainKeysState(selected.address);
    return state[domain];
}

function storeDomainKeys(state: DomainKeysState) {
    const selected = getCurrentAddress();
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
    storagePersistence.set(`${selected.address.toString()}/${collectionKey}`, JSON.stringify(mapped));
}

export const domainKeys = selector<DomainKeysState>({
    key: 'wallet/domainKeys',
    get: ({ get }) => {
        const selected = get(selectedAccountSelector);
        const state = getDomainKeysState(selected?.address);
        return state;
    },
    set: (_, newValue) => {
        storeDomainKeys(newValue as DomainKeysState);
    }
});