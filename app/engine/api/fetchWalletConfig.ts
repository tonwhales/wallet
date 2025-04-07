import axios from "axios";
import * as t from 'io-ts';
import { whalesConnectEndpoint } from "../clients";

export const walletConfigCodec = t.type({
    pools: t.array(t.string),
    recommended: t.string
});

export type WalletConfig = {
    pools: string[],
    recommended: string
}

export async function fetchWalletConfig(address: string) {
    let res = (await axios.get(`${whalesConnectEndpoint}/config/${address}`)).data;
    if (!walletConfigCodec.is(res)) {
        throw Error('Invalid config');
    }

    return res as WalletConfig;
}