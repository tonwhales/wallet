import { Address } from "@ton/core";
import { tryFetchJettonWallet } from "./tryFetchJettonWallet";
import { TonClient4 } from "@ton/ton";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryFetchJettonWallet', () => {
    it('should fetch KOTE wallet', async () => {
        let res = (await tryFetchJettonWallet(client, 20290830, Address.parse('EQCAct0ByjaiUVitqYhJRZPm8NyTVFOuRnPAga7sYXXy5v_z')))!;
        expect(res).not.toBeNull();
        expect(res.balance.toString(10)).toEqual('39980');
        expect(res.owner.equals(Address.parse('EQCo6VT63H1vKJTiUo6W4M8RrTURCyk5MdbosuL5auEqpz-C'))).toBe(true);
        expect(res.master.equals(Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj'))).toBe(true);
    });

    it('should not fetch KOTE wallet for old block', async () => {
        let res = (await tryFetchJettonWallet(client, 10290830, Address.parse('EQCAct0ByjaiUVitqYhJRZPm8NyTVFOuRnPAga7sYXXy5v_z')));
        expect(res).toBeNull();
    });
});