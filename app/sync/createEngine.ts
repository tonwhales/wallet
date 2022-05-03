import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { storagePersistence } from "../storage/storage";
import { createSimpleConnector } from "./Connector";
import { Engine } from "./Engine";

export function createEngine(args: { address: Address, publicKey: Buffer }) {
    return new Engine(
        args.address,
        args.publicKey,
        storagePersistence,
        AppConfig.isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com',
        createSimpleConnector(!AppConfig.isTestnet ? {
            main: 'https://mainnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/estimate',
            sender: 'https://connect.tonhubapi.com/send',
        } : {
            main: 'https://testnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/estimate',
            sender: 'https://connect.tonhubapi.com/send',
        })
    );
}