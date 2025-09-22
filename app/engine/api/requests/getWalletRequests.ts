import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";

export async function getWalletRequests(address: string, isTestnet: boolean, type: 'pending-outgoing' | 'pending-incoming' | 'All') {
    console.log('getWalletRequests', address, isTestnet, type);
    const res = await axios.get(
        `${whalesConnectEndpoint}/wallet-request/${encodeURIComponent(address)}/${isTestnet ? 'testnet' : 'mainnet'}/list`, 
        { params: { type } }
    );
    console.log('getWalletRequests', res.data);
    console.log('getWalletRequests', res.status);
    return res.data;
}