import axios from "axios";
import { WalletKeys } from "../../../storage/walletKeys";
import { whalesConnectEndpoint } from "../../clients";
import { signWalletRequest } from "./signWalletRequest";

function createRequestSignatureMessage(
    requestor: string,
    confirmant: string,
    message: string | undefined,
    expirationSeconds: number = 60 * 5,
    timestamp: number = Math.floor(Date.now() / 1000),
    metadata?: Record<string, any>
): string {
    const parts = [
        'WALLET_REQUEST_CREATE',
        requestor,
        confirmant,
        message || '',
        expirationSeconds.toString(),
        timestamp.toString(),
        metadata ? JSON.stringify(metadata) : ''
    ];

    return parts.join('|');
}

type CreateWalletRequestParams = {
    keys: WalletKeys;
    requester: string;
    confirmant: string;
    message?: string;
    expirationSeconds?: number;
    isTestnet?: boolean;
}

export async function createWalletRequest({ keys, requester, confirmant, message, expirationSeconds, isTestnet }: CreateWalletRequestParams) {
    const signatureMessage = createRequestSignatureMessage(requester, confirmant, message, expirationSeconds);
    const url = `${whalesConnectEndpoint}/wallet-request/create`;

    const signed = signWalletRequest(signatureMessage, keys);

    const body = {
        requestor: requester,
        confirmant: confirmant,
        signature: signed,
        timestamp: Math.floor(Date.now() / 1000),
        network: isTestnet ? 'testnet' : 'mainnet'
    }

    const res = await axios.post(url, body);

    console.log('sendConfirmationRequest', res.data);
    console.log('sendConfirmationRequest', res.status);

    return res.data;
}