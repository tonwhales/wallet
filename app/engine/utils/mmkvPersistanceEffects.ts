import { MMKV } from 'react-native-mmkv';
import { AtomEffect } from 'recoil';


function storeOrDeleteValue<T>(storage: MMKV, params: { key: string, newValue: T | null, isJson?: boolean }) {
    if (params.newValue === null) {
        storage.delete(params.key);
        return;
    }
    let valueToStore: any = params.newValue;
    if (params.isJson) {
        valueToStore = JSON.stringify(params.newValue);
    }

    storage.set(params.key, valueToStore);
}

export function persistedStringEffect(storage: MMKV, key: string): AtomEffect<string | null> {
    return ({ onSet, setSelf }) => {
        onSet((newValue) => storeOrDeleteValue(storage, { key, newValue }));

        let value = storage.getString(key);
        if (!value) {
            setSelf(null);
            return;
        }
        setSelf(value);
    }
}

export function persistedNumberEffect(storage: MMKV, key: string): AtomEffect<number | null> {
    return ({ onSet, setSelf }) => {
        onSet((newValue) => storeOrDeleteValue(storage, { key, newValue }));

        let value = storage.getNumber(key);
        if (!value) {
            setSelf(null);
            return;
        }
        setSelf(value);
    }
}

export function persistedBufferEffect(storage: MMKV, key: string): AtomEffect<Uint8Array | null> {
    return ({ onSet, setSelf }) => {
        onSet((newValue) => storeOrDeleteValue(storage, { key, newValue }));

        let value = storage.getBuffer(key);
        if (!value) {
            setSelf(null);
            return;
        }
        setSelf(value);
    }
}

export function persistedBooleanEffect(storage: MMKV, key: string): AtomEffect<boolean | null> {
    return ({ onSet, setSelf }) => {
        onSet((newValue) => storeOrDeleteValue(storage, { key, newValue }));

        let value = storage.getBoolean(key);
        if (!value) {
            setSelf(null);
            return;
        }
        setSelf(value);
    }
}

export function persistedJsonEffect<T extends object>(storage: MMKV, key: string): AtomEffect<T | null> {
    return ({ onSet, setSelf }) => {
        onSet((newValue) => storeOrDeleteValue(storage, { key, newValue, isJson: true  }));

        let value = storage.getString(key);
        if (!value) {
            setSelf(null);
            return;
        }
        setSelf(JSON.parse(value));
    }
}