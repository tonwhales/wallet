import { WalletV4Source, WalletV4Contract } from 'ton-contracts';

export function contractFromPublicKey(publicKey: Buffer, walletId?: number) {
    const source = WalletV4Source.create({ workchain: 0, publicKey: publicKey, walletId: walletId });
    const contract = WalletV4Contract.create(source);
    return contract;
}