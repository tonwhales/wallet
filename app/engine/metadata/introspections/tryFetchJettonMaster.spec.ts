import { Address } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { tryFetchJettonMaster } from "./tryFetchJettonMaster";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryFetchJettonMaster', () => {
    it('should fetch KOTE wallet', async () => {
        let res = (await tryFetchJettonMaster(client, 20290830, Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')))!;
        expect(res.mintalbe).toBe(true);
        expect(res.totalSupply.toString(10)).toEqual('603066149');
        expect(res.owner?.equals(Address.parse('EQCdp7fR_iHcxO8PGuVbV6DgleITPLPebeQmfZdExgxPFj3a'))).toBe(true);
        expect(res.content).not.toBeNull();
        expect(res.content!.type).toEqual('offchain');
        expect((res.content! as { type: 'offchain', link: string }).link).toEqual('https://kotecoin.com/kote.json');
    });
    
    it('should fetch onchain wallet', async () => {
        let res = (await tryFetchJettonMaster(client, 23312939, Address.parse('EQD8a5p-Imf9cU55wB66guXwNSGv8lSGg-zFregbVXY0V51L')))!;
        expect(res.mintalbe).toBe(true);
        expect(res.owner?.equals(Address.parse('EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ'))).toBe(true);
        expect(res.totalSupply.toString(10)).toEqual('1231333000000000');
        expect(res.content).not.toBeNull();
        expect(res.content!.type).toEqual('onchain');
    });

    it('should not fetch KOTE wallet for old block', async () => {
        let res = (await tryFetchJettonMaster(client, 10290830, Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')));
        expect(res).toBeNull();
    });
});