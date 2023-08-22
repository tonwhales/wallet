import BN from 'bn.js';

export function useAccount() {
    return {
        address: 'string',
        publicKey: Buffer.from('string'),
        seqno: 1,
        balance: new BN(0),
    }
}