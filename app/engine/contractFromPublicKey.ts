import { WalletContractV4 } from '@ton/ton';

export function contractFromPublicKey(publicKey: Buffer) {
    return WalletContractV4.create({ workchain: 0, publicKey: publicKey });
}