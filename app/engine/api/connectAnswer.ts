import axios from "axios";
import * as t from 'io-ts';

const connectAnswerResCode = t.type({ ok: t.boolean, })

export async function connectAnswer({
    reportEndpoint,
    key,
    appPublicKey,
    address,
    walletType,
    walletConfig,
    walletSig,
    endpoint,
    name,
    testnet,
    kind
}: {
    reportEndpoint: string,
    key: string,
    appPublicKey: string,
    address: string,
    walletType: string,
    walletConfig: string,
    walletSig: string,
    endpoint: string | null,
    name?: string,
    testnet?: boolean,
    kind?: 'ton-x' | 'tonconnect-v2'
}) {
    let res = await axios.post('https://' + reportEndpoint + '/connect/answer', {
        key,
        appPublicKey,
        address,
        walletType,
        walletConfig,
        walletSig,
        endpoint,
        name,
        testnet,
        kind,
    }, { timeout: 5000 });

    if (!connectAnswerResCode.is(res.data)) {
        throw Error('Failed to post connect answer');
    }

    return res;
}