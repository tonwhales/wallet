import { WalletContractType, WalletV1R2Source, Contract, WalletSource, contractAddress, Address, InternalMessage, createWalletTransferV1, createWalletTransferV2, createWalletTransferV3, WalletV1R3Source, WalletV2R1Source, WalletV2R2Source, WalletV3R1Source, WalletV3R2Source } from 'ton';
import { WalletV4Source, WalletV4Contract } from 'ton-contracts';
import { Maybe } from 'ton/dist/types';

class WalletContract implements Contract {

    static create(source: WalletSource) {
        let address = contractAddress(source);
        return new WalletContract(source, address);
    }

    readonly address: Address;
    readonly source: WalletSource;

    constructor(source: WalletSource, address: Address) {
        this.address = address;
        this.source = source;
    }

    createTransfer(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer, timeout?: Maybe<number>, walletId?: Maybe<number> }) {
        switch (this.source.walletVersion) {
            case 'v1':
                return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
            case 'v2':
                return createWalletTransferV2({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, timeout: args.timeout });
            case 'v3':
                return createWalletTransferV3({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, walletId: this.source.walletId, timeout: args.timeout });
            default:
                throw Error('Unknown contract type: ' + (this.source as any).type);
        }
    }
}

export function contractFromPublicKeyTyped(publicKey: Buffer, type: WalletContractType) {
    let source: WalletSource | WalletV4Source;
    switch (type) {
        case 'org.ton.wallets.simple.r2': {
            source = WalletV1R2Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        case 'org.ton.wallets.simple.r3': {
            source = WalletV1R3Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        case 'org.ton.wallets.v2': {
            source = WalletV2R1Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        case 'org.ton.wallets.v2.r2': {
            source = WalletV2R2Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        case 'org.ton.wallets.v3': {
            source = WalletV3R1Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        case 'org.ton.wallets.v3.r2': {
            source = WalletV3R2Source.create({ workchain: 0, publicKey: publicKey });
            break;
        }
        default:
            throw Error('Unknown contract type: ' + type);
    }
    return WalletContract.create(source);
}

export function contractFromPublicKey(publicKey: Buffer) {
    const source = WalletV4Source.create({ workchain: 0, publicKey: publicKey });
    const contract = WalletV4Contract.create(source);
    return contract;
}