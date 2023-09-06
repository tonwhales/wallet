import BN from 'bn.js';

export function useAccount(): { 
    address: string,
    publicKey: Buffer,
    seqno: number,
    balance: BN,
 } {

    return {
        address: 'string',
        publicKey: Buffer.from('string'),
        seqno: 1,
        balance: new BN(1e9).muln(10),
        transactions: [],
    }
}