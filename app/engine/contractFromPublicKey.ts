import { WalletV4Source, WalletV4Contract } from 'ton-contracts';

export function contractFromPublicKey(publicKey: Buffer) {
    const source = WalletV4Source.create({ workchain: 0, publicKey: publicKey });
    const contract = WalletV4Contract.create(source);
    return contract;
}