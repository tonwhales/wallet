import axios from "axios";
import { Address } from "@ton/core";
import * as t from 'io-ts';

const codec = t.type({
    hints: t.array(t.string),
    now: t.number,
});

export async function fetchHints(address: string) {
    let res = (await axios.get(`https://connect.tonhubapi.com/hints/${encodeURIComponent(address)}?version=1`)).data;
    if (!codec.is(res)) {
        throw Error('Invalid hints');
    }
    return res;
}