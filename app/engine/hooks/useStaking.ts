import BN from 'bn.js';

export function useStaking() {
    return {
        total: new BN(0),
    } as any;
}