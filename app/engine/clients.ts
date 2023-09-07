import { TonClient4 } from 'ton';
import { QueryClient } from '@tanstack/react-query';

export const clients = {
    ton: {
        testnet: new TonClient4({ endpoint: 'https://testnet-v4.tonhubapi.com', timeout: 5000 }),
        mainnet: new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com', timeout: 5000 }),
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            cacheTime: Infinity,
        }
    }
});