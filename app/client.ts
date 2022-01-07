import { BN } from "bn.js";
import { Address, TonClient } from "ton";
import axious from 'axios';

export const client = new TonClient({ endpoint: 'https://scalable-api.tonwhales.com/jsonRPC' });

export async function fetchBalance(address: Address) {
    let res = await axious.get('https://ton-storage.tonhub.com/address/' + address.toFriendly(), { timeout: 5000 });
    // if (!res.ok) {
    //     throw Error('Unable to fetch balance');
    // }
    // let body = await res.json();
    // if (!body.exist) {
    //     return new BN(0);
    // }

    // return new BN(body.state.balance, 10);
    return new BN(res.data.balance, 10);
}