import { Address, TonClient4 } from "ton";
import { tryFetchJettonMaster } from "./tryFetchJettonMaster";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryFetchJettonMaster', () => {
    it('should fetch KOTE wallet', async () => {
        let res = (await tryFetchJettonMaster(client, 20290830, Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')))!;
        expect(res.mintalbe).toBe(true);
        expect(res.totalSupply.toString(10)).toEqual('603066149');
        expect(res.owner.equals(Address.parse('EQCdp7fR_iHcxO8PGuVbV6DgleITPLPebeQmfZdExgxPFj3a'))).toBe(true);
        expect(res.content).not.toBeNull();
        expect(res.content!.type).toEqual('offchain');
        expect(res.content!.link).toEqual('https://kotecoin.com/kote.json');
    });

    it('should not fetch KOTE wallet for old block', async () => {
        let res = (await tryFetchJettonMaster(client, 10290830, Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')));
        expect(res).toBeNull();
    });

    it('should fetch BCH-example onchain wallet', async () => {
        let res = (await tryFetchJettonMaster(client, 21862782, Address.parse('EQBb4JNqn4Z6U6-nf0cSLnOJo2dxj1QRuGoq-y6Hod72jPbl')))!;
        expect(res.mintalbe).toBe(true);
        expect(res.totalSupply.toString(10)).toEqual('20999999000000000');
        expect(res.owner.equals(Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'))).toBe(true);
        expect(res.content).not.toBeNull();
        expect(res.content!.type).toEqual('onchain');
        // expect(res.content!.onchainContent).toEqual('onchain'); // TODO
        // expect(res.content!.link).toEqual('https://kotecoin.com/kote.json');
    });
});