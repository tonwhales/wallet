import { FlagKey, FlagValueOf } from '../../flags/flagRegistry';
import { resolveFlagValue } from '../../flags/resolveFlagValue';
import { useFlagsSnapshot } from './useFlags';

export function useFlag<K extends FlagKey>(key: K): FlagValueOf<K> {
    const snapshot = useFlagsSnapshot();
    return resolveFlagValue(key, snapshot, Date.now());
}
