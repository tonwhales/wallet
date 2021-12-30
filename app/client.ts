import { BN } from "bn.js";
import { Address, TonClient } from "ton";

export const client = new TonClient({ endpoint: 'https://scalable-api.tonwhales.com/jsonRPC' });

export async function fetchBalance(address: Address) {
    // let res = await fetch('https://ton-fast-api-6dza2.ondigitalocean.app/address/' + address.toFriendly());
    // if (!res.ok) {
    //     throw Error('Unable to fetch balance');
    // }
    // let body = await res.json();
    // if (!body.exist) {
    //     return new BN(0);
    // }

    // return new BN(body.state.balance, 10);
    return await client.getBalance(address);
}