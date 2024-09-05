import axios from "axios";

export type GasslessSendParams = {
    wallet_public_key: string,
    boc: string
}

export async function fetchGaslessSend(body: GasslessSendParams, isTestnet: boolean) {
    const endpoint = isTestnet ? "https://testnet.tonapi.io" : "https://tonapi.io";
    const url = `${endpoint}/v2/gasless/send`;

    const res = await axios.post(url, body, { method: 'POST' });

    if (res.status !== 200) {
        throw new Error('Failed to fetch gasless send');
    }
}