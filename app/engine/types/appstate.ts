import { Address } from '@ton/core';

export enum WalletVersions {
    v4R2 = "v4R2",
    v5R1 = "v5R1",
}

export type SelectedAccount = {
    address: Address;
    addressString: string;
    publicKey: Buffer;
    secretKeyEnc: Buffer;
    utilityKey: Buffer;
    version: WalletVersions;
    ethereumSecretKeyEnc?: Buffer;
}
