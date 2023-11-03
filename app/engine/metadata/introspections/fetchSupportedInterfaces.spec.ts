import { Address } from "@ton/core";
import { fetchSupportedInterfaces } from "./fetchSupportedInterfaces";
import { TonClient4 } from '@ton/ton';

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('fetchSupportedInterfaces', () => {
    it('should fetch staking pool interfaces', async () => {
        let res = (await fetchSupportedInterfaces(client, 20290830, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')))!;
        expect(res).toMatchObject(['256184278959413194623484780286929323492']);
    });

    it('should not fetch staking pool interfaces for old block', async () => {
        let res = (await fetchSupportedInterfaces(client, 10290830, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')))!;
        expect(res).toMatchObject([]);
    });
});