import { WalletContractV4 } from '@ton/ton';
import { ConfigStore } from '../utils/ConfigStore';

export const walletContactType = 'org.ton.wallets.v4';

export function contractFromPublicKey(publicKey: Buffer) {
    return WalletContractV4.create({ workchain: 0, publicKey: publicKey });
}

export function walletConfigFromContract(contract: WalletContractV4) {
    const config = new ConfigStore();
    config.setInt('wc', contract.workchain);
    config.setBuffer('pk', contract.publicKey);
    config.setInt('walletId', contract.walletId);

    const walletConfig = config.save();
    const walletType = walletContactType;

    return { walletConfig, type: walletType };
}