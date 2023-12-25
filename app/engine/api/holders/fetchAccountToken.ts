import axios from 'axios';
import { holdersEndpoint } from './fetchAccountState';

export async function fetchAccountToken(config: {
    address: string,
    walletConfig: string,
    walletType: string,
    time: number,
    signature: string,
    subkey: {
        domain: string,
        publicKey: string,
        time: number,
        signature: string
    }
}, isTestnet: boolean): Promise<string> {
    let res = await axios.post(
        'https://' + holdersEndpoint +'/v2/user/wallet/connect',
        {
            stack: 'ton',
            network: isTestnet ? 'ton-testnet' : 'ton-mainnet',
            key: {
                kind: 'ton-x-lite',
                config
            }
        }
    );
    if (!res.data.ok) {
        throw Error('Failed to fetch card token');
    }
    return res.data.token as string;
}