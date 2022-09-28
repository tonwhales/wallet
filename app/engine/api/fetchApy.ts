import axios from "axios";
import * as t from 'io-ts';
import { AppConfig } from "../../AppConfig";

const apyCodec = t.type({
    apy: t.string
});

export type StakingAPY = {
    apy: number
};

export async function fetchApy() {
    const res = ((await axios.get(`https://connect.tonhubapi.com/net/${AppConfig.isTestnet ? 'testnet' : 'mainnet'}/elections/latest/apy`, { method: 'GET' })).data);
    console.log(res);
    if (!apyCodec.is(res)) {
        throw Error('Invalid apy');
    }

    return { apy: parseFloat(res.apy) } as StakingAPY;
}