import { Address } from '@ton/core';

export type SelectedAccount = {
    address: Address;
    addressString: string;
    publicKey: Buffer;
    secretKeyEnc: Buffer;
    utilityKey: Buffer;
}
