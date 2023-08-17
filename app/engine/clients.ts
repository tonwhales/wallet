import { TonClient4 } from 'ton';

export const Clients = {
    ton: {
        testnet: new TonClient4({ endpoint: 'testnet-v4.tonhubapi.com', timeout: 5000 }),
        mainnet: new TonClient4({ endpoint: 'mainnet-v4.tonhubapi.com', timeout: 5000 }),
    }
}