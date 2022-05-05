import { Address, TonClient4 } from "ton";
import { fetchPlugins } from "./fetchPlugins";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('fetchPlugins', () => {
    it('should fetch plugins', async () => {
        const fetched = await fetchPlugins(client, 20308658, Address.parse('EQBbdsQXlyfZVo94mXw6MkJ0y71RYwGcVJDKD45FMQJCUDE2'));
        expect(fetched.length).toBe(1);
        expect(fetched[0].equals(Address.parse('EQA1qk4-CZvRERNsdziSoKW14MRDOiQI5ggvf4nZ2bFKeAkn')));
    });
});