import axios from 'axios';
import { AppConfig } from '../../../AppConfig';
import { zenPayEndpoint } from '../../corp/ZenPayProduct';

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
}): Promise<string> {
    let res = await axios.post(
        'https://' + zenPayEndpoint +'/account/connect',
        {
            stack: 'ton',
            network: AppConfig.isTestnet ? 'ton-testnet' : 'ton-mainnet',
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