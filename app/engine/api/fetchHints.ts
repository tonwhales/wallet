import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import * as t from 'io-ts';

const codec = t.type({
    hints: t.array(t.string)
});

export async function fetchHints(address: Address) {
    let res = (await axios.get('https://connect.tonhubapi.com/hints/' + address.toFriendly({ testOnly: AppConfig.isTestnet, urlSafe: true }))).data;
    if (!codec.is(res)) {
        throw Error('Invalid hints');
    }
    return res.hints.map((v) => Address.parse(v));
}