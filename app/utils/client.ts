import { TonClient } from "ton";
import { AppConfig } from "../AppConfig";

const endpoints = !AppConfig.isTestnet ? {
    main: 'https://mainnet.tonhubapi.com',
    estimate: 'https://connect.tonhubapi.com/estimate',
    sender: 'https://connect.tonhubapi.com/send',
} : {
    main: 'https://testnet.tonhubapi.com',
    estimate: 'https://connect.tonhubapi.com/estimate',
    sender: 'https://connect.tonhubapi.com/send',
}

export const tonClient = new TonClient({ endpoint: endpoints.main + '/jsonRPC' });