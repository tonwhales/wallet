import { WalletV4Source, WalletV4Contract } from 'ton-contracts';

export async function contractFromPublicKey(publicKey: Buffer) {
    const source = WalletV4Source.create({ workchain: 0, publicKey: publicKey });
    const contract = await WalletV4Contract.create(source);
    return contract;
}