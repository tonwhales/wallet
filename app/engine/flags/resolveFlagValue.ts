import { FLAG_DEFAULTS, FLAGS_MAX_AGE_MS, FlagKey, FlagValueOf } from './flagRegistry';

export type FlagsSnapshot = {
    flags: Record<string, boolean | string>;
    updatedAt: number;
};

export function resolveFlagValue<K extends FlagKey>(
    key: K,
    snapshot: FlagsSnapshot | null | undefined,
    now: number
): FlagValueOf<K> {
    const fallback = FLAG_DEFAULTS[key] as FlagValueOf<K>;

    if (!snapshot || now - snapshot.updatedAt > FLAGS_MAX_AGE_MS) {
        return fallback;
    }

    const value = snapshot.flags[key];

    return typeof value === typeof fallback ? (value as FlagValueOf<K>) : fallback;
}

export function msUntilFlagsExpire(updatedAt: number, now: number): number {
    return updatedAt + FLAGS_MAX_AGE_MS - now + 1;
}
