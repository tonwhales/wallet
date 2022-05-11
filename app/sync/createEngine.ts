import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { storagePersistence } from "../storage/storage";
import { createSimpleConnector } from "./api/Connector";
import { Engine } from "./Engine";

export function createEngine(args: { address: Address, publicKey: Buffer }) {
    return new Engine(
        args.address,
        args.publicKey,
        storagePersistence,
        AppConfig.isTestnet ? 'sandbox-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com',
        createSimpleConnector(!AppConfig.isTestnet ? {
            main: 'https://mainnet.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/mainnet/estimate',
            sender: 'https://connect.tonhubapi.com/net/mainnet/send',
        } : {
            main: 'https://sandbox.tonhubapi.com',
            estimate: 'https://connect.tonhubapi.com/net/sandbox/estimate',
            sender: 'https://connect.tonhubapi.com/net/sandbox/send',
        })
    );
}