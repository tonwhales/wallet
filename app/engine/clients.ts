import { TonClient4 } from '@ton/ton';
import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as Application from 'expo-application';


const requestInterceptorMainnet = (config: any) => {
    config.headers['User-Agent'] = `Tonhub/${Application.nativeApplicationVersion} ${Platform.OS}`;
    return config;
};

const requestInterceptorTestnet = (config: any) => {
    config.headers['User-Agent'] = `Tonhub/${Application.nativeApplicationVersion} ${Platform.OS} (testnet)`;
    return config;
};

export const clients = {
    ton: {
        testnet: new TonClient4({ endpoint: 'https://testnet-v4.tonhubapi.com', timeout: 5000, requestInterceptor: requestInterceptorTestnet }),
        mainnet: new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com', timeout: 5000, requestInterceptor: requestInterceptorMainnet }),
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            cacheTime: Infinity,
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            retry: true,
        }
    },
});