import { Address } from "@ton/core";
import { fetchPlugins } from "./fetchPlugins";
import { TonClient4 } from '@ton/ton';

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('fetchPlugins', () => {
    it('should fetch plugins', async () => {
        const fetched = await fetchPlugins(client, 20308658, Address.parse('EQBbdsQXlyfZVo94mXw6MkJ0y71RYwGcVJDKD45FMQJCUDE2'));
        expect(fetched.length).toBe(1);
        expect(fetched[0].equals(Address.parse('EQA1qk4-CZvRERNsdziSoKW14MRDOiQI5ggvf4nZ2bFKeAkn')));
    });

    it('should fetch multiple plugins', async () => {
        const fetched = await fetchPlugins(client, 20695569, Address.parse('EQBvGo6ig2AqszQegikezWsfiBPxk6qehCIurkp-_oI5EUDT'));
        console.warn(fetched);
        expect(fetched.length).toBe(2);
        expect(fetched[0].equals(Address.parse('EQCt8gm7hhPh5ygcsXVEeXY1vuvpaak8Ftvs2h5wOSM7OXiK')));
        expect(fetched[1].equals(Address.parse('EQBP5RgeNPSdNcHB3QRuYz-Sc9oeP4Awy0TeM09v69kI1I_S')));
    });
});