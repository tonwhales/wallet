import { RecoilValueReadOnly, useRecoilValue } from "recoil";

export interface PersistedItem<T> {
    update(updater: (value: T | null) => T | null): void;
    get value(): T | null;
    atom: RecoilValueReadOnly<T | null>;

    on(event: 'updated', callback: (value: T | null) => void): void;
    off(event: 'updated', callback: (value: T | null) => void): void;
    once(event: 'updated', callback: (value: T | null) => void): void;
    for(callback: (value: T) => void): void;
}

export function useItem<T>(src: PersistedItem<T>) {
    let value = useRecoilValue(src.atom);
    if (value === null) {
        throw Error('Unexpected empty value at ' + src.atom.key);
    }
    return value;
}

export function useOptItem<T>(src: PersistedItem<T>) {
    return useRecoilValue(src.atom);
}