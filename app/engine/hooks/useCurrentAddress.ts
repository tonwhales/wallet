import { useMemo } from 'react';
import { getCurrentAddress } from '../../storage/appState';

export function useCurrentAddress() {
    return useMemo(() => getCurrentAddress(), []);
}