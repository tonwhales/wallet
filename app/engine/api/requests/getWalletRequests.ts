import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";

export async function getWalletRequests(address: string, isTestnet: boolean, type: 'pending-outgoing' | 'pending-incoming' | 'All') {
    const res = await axios.get(
        `${whalesConnectEndpoint}/wallet-request/${encodeURIComponent(address)}/${isTestnet ? 'testnet' : 'mainnet'}/list`, 
        { params: { type } }
    );
    return res.data;
}