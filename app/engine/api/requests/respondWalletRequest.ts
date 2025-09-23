import axios from "axios";
import { WalletKeys } from "../../../storage/walletKeys";
import { whalesConnectEndpoint } from "../../clients";
import { signWalletRequest } from "./signWalletRequest";
import { WalletRequest } from "../../WalletRequestsWatcher";

function createResponseSignatureMessage(
    requestId: string,
    walletAddress: string,
    status: string,
    response: string | undefined,
    timestamp: number = Math.floor(Date.now() / 1000)
): string {
    const parts = [
        'WALLET_REQUEST_RESPOND',
        requestId,
        walletAddress,
        status,
        response || '',
        timestamp.toString()
    ];

    return parts.join('|');
}

type RespondWalletRequest = {
    keys: WalletKeys,
    requestId: string,
    walletAddress: string,
    status: 'confirmed' | 'declined',
    response?: string,
    isTestnet?: boolean
}

export async function respondWalletRequest({ keys, requestId, walletAddress, status, response, isTestnet }: RespondWalletRequest) {
    const signature = createResponseSignatureMessage(requestId, walletAddress, status, response);
    const url = `${whalesConnectEndpoint}/wallet-request/respond`;

    const signed = await signWalletRequest(signature, keys);

    const body = {
        requestId: requestId,
        walletAddress: walletAddress,
        status: status,
        signature: signed,
        timestamp: Math.floor(Date.now() / 1000),
        network: isTestnet ? 'testnet' : 'mainnet'
    }

    const res = await axios.post(url, body);

    return res.data as { success: boolean, request: WalletRequest };
}