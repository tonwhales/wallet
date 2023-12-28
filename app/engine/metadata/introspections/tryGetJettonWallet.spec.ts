import { Address } from "@ton/core";
import { tryGetJettonWallet } from "./tryGetJettonWallet";
import { TonClient4 } from "@ton/ton";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryGetJettonWallet', () => {
    it('should fetch KOTE wallet', async () => {
        let res = (await tryGetJettonWallet(client, 20290830, { address: Address.parse('EQCo6VT63H1vKJTiUo6W4M8RrTURCyk5MdbosuL5auEqpz-C'), master: Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj') }))!;
        expect(res).not.toBeNull();
        expect(res.equals(Address.parse('EQCAct0ByjaiUVitqYhJRZPm8NyTVFOuRnPAga7sYXXy5v_z'))).toBe(true)
    });

    it('should not fetch KOTE wallet for old block', async () => {
        let res = (await tryGetJettonWallet(client, 10290830, { address: Address.parse('EQCo6VT63H1vKJTiUo6W4M8RrTURCyk5MdbosuL5auEqpz-C'), master: Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj') }))!;
        expect(res).toBeNull();
    });
});