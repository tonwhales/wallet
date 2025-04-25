import axios from "axios";
import * as t from 'io-ts';
import { whalesConnectEndpoint } from "../clients";

export const serverConfigCodec = t.type({
    wallets: t.type({
        restrict_send: t.array(t.string),
        spam: t.array(t.string)
    })
});

export type ServerConfig = {
    wallets: {
        restrict_send: string[],
        spam: string[]
    }
}

export async function fetchConfig() {
    let res = (await axios.get(`${whalesConnectEndpoint}/config`)).data;
    if (!serverConfigCodec.is(res)) {
        throw Error('Invalid config');
    }

    return res as ServerConfig;
}