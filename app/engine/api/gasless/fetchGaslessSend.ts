import axios from "axios";

export type GasslessSendParams = {
    wallet_public_key: string,
    boc: string
}

export async function fetchGaslessSend(body: GasslessSendParams, isTestnet: boolean) {
    const endpoint = isTestnet ? "https://testnet.tonapi.io" : "https://tonapi.io";
    const url = `${endpoint}/v2/gasless/send`;

    console.log('fetchGaslessSend', url, body);

    const res = await axios.post(url, body, { method: 'POST' });

    console.log('fetchGaslessSend', res.status, res.data);

    if (res.status !== 200) {
        throw new Error('Failed to fetch gasless send');
    }
}