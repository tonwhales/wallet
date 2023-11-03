import { Address } from "@ton/core";
import { tryFetchLegacyPlugin } from "./tryFetchLegacyPlugin";
import { TonClient4 } from "@ton/ton";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryFetchLegacyPlugin', () => {
    it('should plugin data', async () => {
        const fetched = (await tryFetchLegacyPlugin(client, 20308658, Address.parse('EQA1qk4-CZvRERNsdziSoKW14MRDOiQI5ggvf4nZ2bFKeAkn')))!;
        expect(fetched.wallet.equals(Address.parse('EQBbdsQXlyfZVo94mXw6MkJ0y71RYwGcVJDKD45FMQJCUDE2'))).toBe(true);
        expect(fetched.beneficiary.equals(Address.parse('EQANK8yfgQuzODNFuSIMjYOsgINWAZaU_5VtQZWSuJsp4D0I'))).toBe(true);
        expect(fetched.amount === BigInt('2000000000')).toBe(true);
        expect(fetched.period).toBe(2629800);
        expect(fetched.startAt).toBe(1651593621);
        expect(fetched.timeout).toBe(10800);
        expect(fetched.lastPayment).toBe(1651593624);
        expect(fetched.lastRequest).toBe(0);
        expect(fetched.failedAttempts).toBe(0);
        expect(fetched.subscriptionId).toEqual('202778');
    });
});