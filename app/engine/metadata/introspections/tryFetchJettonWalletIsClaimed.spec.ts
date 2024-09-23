import { Address } from "@ton/core";
import { tryFetchJettonWalletIsClaimed } from "./tryFetchJettonWalletIsClaimed";
import { TonClient4 } from "@ton/ton";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com', timeout: 5000, });

describe('tryFetchJettonWalletIsClaimed', () => {
    it('should fetch is claimed: true', async () => {
        let res = (await tryFetchJettonWalletIsClaimed(client, 40498629, Address.parse('EQAYPGheJ6Pbv85zf1nWzXRaZhSN2aWw7pSsrJtBOE6RJxvt')))!;
        expect(res).not.toBeNull();
        expect(res).toBe(true);
    });

    it('should fetch is claimed: false', async () => {
        let res = (await tryFetchJettonWalletIsClaimed(client, 40498629, Address.parse('EQCRuNW8buZSMivhTNNdFIhyoR7ecX-Uao5xgZAABWlW7ho1')))!;
        expect(res).not.toBeNull();
        expect(res).toBe(false);
    });

    it('should fetch is claimed: null', async () => {
        let res = (await tryFetchJettonWalletIsClaimed(client, 40498629, Address.parse('UQCZXhk9pNjZvFohplQXrQG3NDgYKya4C3QwASqXnEJ4TNqd')))!;
        expect(res).toBeNull();
    });
});