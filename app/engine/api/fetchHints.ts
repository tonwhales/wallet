import axios from "axios";
import * as t from 'io-ts';
import { whalesConnectEndpoint } from "../clients";

const codec = t.type({
    hints: t.array(t.string),
    now: t.number,
});

export async function fetchHints(address: string) {
    let res = (await axios.get(`${whalesConnectEndpoint}/hints/${encodeURIComponent(address)}?version=1`)).data;
    if (!codec.is(res)) {
        throw Error('Invalid hints');
    }
    return res;
}