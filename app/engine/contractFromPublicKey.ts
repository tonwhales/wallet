import { beginCell, WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { ConfigStore } from '../utils/ConfigStore';
import { WalletVersions } from './types';

export const walletContactTypeV4 = 'org.ton.wallets.v4';
export const walletContactTypeV5 = 'org.ton.wallets.v5';

export function contractFromPublicKey(publicKey: Buffer, version: WalletVersions = WalletVersions.v4R2, isTestnet: boolean) {
    if (version === WalletVersions.v5R1) {
        return WalletContractV5R1.create({ workchain: 0, publicKey: publicKey, walletId: { networkGlobalId: isTestnet ? -3 : -239 } });
    }

    return WalletContractV4.create({ workchain: 0, publicKey: publicKey });
}

export interface WalletIdV5R1ClientContext {
    readonly walletVersion: 'v5r1';
    readonly workchain: number;
    readonly subwalletNumber: number;
}

const walletV5R1VersionsSerialisation: Record<WalletIdV5R1ClientContext['walletVersion'], number> = {
    v5r1: 0
}

export function getWalletIdV5R1(contract: WalletContractV5R1) {
    const walletId = contract.walletId;

    let context;
    let workchain = 0;
    if (!!walletId.context && typeof walletId.context !== 'number' && walletId.context.workchain !== undefined) {
        context = beginCell()
            .storeUint(1, 1)
            .storeInt(walletId.context.workchain, 8)
            .storeUint(walletV5R1VersionsSerialisation[walletId.context.walletVersion], 8)
            .storeUint(walletId.context.subwalletNumber, 15)
            .endCell().beginParse().loadInt(32);
        workchain = walletId.context.workchain;
    } else {
        context = beginCell()
            .storeUint(0, 1)
            .storeUint((walletId.context as number), 31)
            .endCell().beginParse().loadInt(32);
    }

    const walletIdBigInt = BigInt(walletId.networkGlobalId) ^ BigInt(context);
    const walletIdNumber = beginCell()
        .storeInt(walletIdBigInt, 32)
        .endCell().beginParse().loadInt(32);

    return {
        workchain,
        walletId: walletIdNumber
    };
}

export function walletConfigFromContract(contract: WalletContractV4 | WalletContractV5R1) {
    if (contract instanceof WalletContractV5R1) {
        const { workchain, walletId } = getWalletIdV5R1(contract);

        const config = new ConfigStore();
        config.setInt('wc', workchain);
        config.setBuffer('pk', contract.publicKey);
        config.setInt('walletId', walletId);

        const walletConfig = config.save();
        const walletType = walletContactTypeV5;

        return { walletConfig, type: walletType };
    } else {
        const config = new ConfigStore();
        config.setInt('wc', contract.workchain);
        config.setBuffer('pk', contract.publicKey);
        config.setInt('walletId', contract.walletId);

        const walletConfig = config.save();
        const walletType = walletContactTypeV4;

        return { walletConfig, type: walletType };
    }
}