import axios from "axios";
import * as t from 'io-ts';
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";

export const walletConfigCodec = t.type({
    pools: t.array(t.string),
    recommended: t.string
});

export type WalletConfig = {
    pools: string[],
    recommended: string
}

export async function fetchWalletConfig(address: Address) {
    let res = (await axios.get('https://connect.tonhubapi.com/config/' + address.toFriendly({ testOnly: AppConfig.isTestnet }))).data;
    if (!walletConfigCodec.is(res)) {
        throw Error('Invalid config');
    }

    return res as WalletConfig;
}