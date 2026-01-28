import { Base64, ConnectEvent, DisconnectEvent, hexToByteArray, RpcMethod, SessionCrypto, WalletResponse } from "@tonconnect/protocol";
import axios from "axios";
import { warn } from "../../utils/log";
import { bridgeUrl } from "../tonconnect/config";
import { saveErrorLog } from "../../storage";

export const defaultTtl = 300;

export async function sendTonConnectResponse<T extends RpcMethod>({
    response,
    sessionCrypto,
    clientSessionId,
    bridge,
    ttl
}: {
    response: WalletResponse<T> | ConnectEvent | DisconnectEvent,
    sessionCrypto: SessionCrypto,
    clientSessionId: string,
    bridge?: string,
    ttl?: number,
}): Promise<void> {
    try {
        // Form url with client session id
        const url = `${bridge ?? bridgeUrl}/message?client_id=${sessionCrypto.sessionId}&to=${clientSessionId}&ttl=${ttl || defaultTtl}`;

        // Encrypt response
        const encodedResponse = sessionCrypto.encrypt(
            JSON.stringify(response),
            hexToByteArray(clientSessionId),
        );

        await axios.post(url, Base64.encode(encodedResponse), { headers: { 'Content-Type': 'text/plain' } });
    } catch (error) {
        saveErrorLog({
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            url: 'sendTonConnectResponse',
            additionalData: { ttl }
        });
        warn('Failed to send TonConnect response');
    }
}