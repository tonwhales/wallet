import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { ConfigStore } from '../utils/ConfigStore';
import { WalletVersions } from './state/walletVersions';

export const walletContactType = 'org.ton.wallets.v4';

export function contractFromPublicKey(publicKey: Buffer, version: WalletVersions = WalletVersions.v4R2) {
    if (version === WalletVersions.v5R1) {
        return WalletContractV5R1.create({ workChain: 0, publicKey: publicKey });
    }

    return WalletContractV4.create({ workchain: 0, publicKey: publicKey });
}

export function walletConfigFromContract(contract: WalletContractV4 | WalletContractV5R1) {
    if (contract instanceof WalletContractV5R1) {

        // TODO: 
        // const config = new ConfigStore();
        // config.setInt('wc', contract.workChain);
        // config.setBuffer('pk', contract.publicKey);
        // config.setInt('walletId', contract.walletId);
    
        // const walletConfig = config.save();
        // const walletType = walletContactType;
    
        // return { walletConfig, type: walletType };
    } else {
        const config = new ConfigStore();
        config.setInt('wc', contract.workchain);
        config.setBuffer('pk', contract.publicKey);
        config.setInt('walletId', contract.walletId);
    
        const walletConfig = config.save();
        const walletType = walletContactType;
    
        return { walletConfig, type: walletType };
    }
   
}