import { RecoilValueReadOnly, useRecoilValue } from "recoil";

export type PersistedItem<T> = {
    update(updater: (value: T | null) => T | null): void;
    get value(): T | null;
    atom: RecoilValueReadOnly<T | null>;
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