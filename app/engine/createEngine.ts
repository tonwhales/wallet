import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { storagePersistence } from "../storage/storage";
import { log } from "../utils/log";
import { createSimpleConnector } from "./api/Connector";
import { Engine } from "./Engine";

export function createEngine(args: { address: Address, publicKey: Buffer, utilityKey: Buffer, recoilUpdater: (node: any, value: any) => void }) {
    let start = Date.now();
    log('Starting engine...');
    let res = new Engine(
        args.address,
        args.publicKey,
        args.utilityKey,
        storagePersistence,
        AppConfig.isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com',
        createSimpleConnector(!AppConfig.isTestnet ? {
            main: 'https://mainnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/mainnet/estimate',
            sender: 'https://connect.tonhubapi.com/net/mainnet/send',
        } : {
            main: 'https://testnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/testnet/estimate',
            sender: 'https://connect.tonhubapi.com/net/testnet/send',
        }),
        { updater: args.recoilUpdater }
    );
    log('Engine started in ' + (Date.now() - start) + ' ms');
    return res;
}