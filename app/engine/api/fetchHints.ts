import axios from "axios";
import { Address } from "ton";
import * as t from 'io-ts';

const codec = t.type({
    hints: t.array(t.string)
});

export async function fetchHints(address: Address, isTestnet: boolean) {
    let res = (await axios.get('https://connect.tonhubapi.com/hints/' + address.toFriendly({ testOnly: isTestnet, urlSafe: true }))).data;
    if (!codec.is(res)) {
        throw Error('Invalid hints');
    }
    return res.hints.map((v) => Address.parse(v));
}