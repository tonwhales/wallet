import { Address } from "ton";
import { storagePersistence } from "../storage/storage";
import { log } from "../utils/log";
import { createSimpleConnector } from "./api/Connector";
import { Engine } from "./Engine";

export function createEngine(args: { address: Address, publicKey: Buffer, utilityKey: Buffer, recoilUpdater: (node: any, value: any) => void, isTestnet: boolean }) {
    let start = Date.now();
    log('Starting engine...');
    let res = new Engine(
        args.address,
        args.publicKey,
        args.utilityKey,
        storagePersistence,
        args.isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com',
        createSimpleConnector(!args.isTestnet ? {
            main: 'https://mainnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/mainnet/estimate',
            sender: 'https://connect.tonhubapi.com/net/mainnet/send',
        } : {
            main: 'https://testnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/testnet/estimate',
            sender: 'https://connect.tonhubapi.com/net/testnet/send',
        }),
        { updater: args.recoilUpdater },
        args.isTestnet
    );
    log('Engine started in ' + (Date.now() - start) + ' ms');
    return res;
}