import { BN } from "bn.js";
import { Address, TonClient4 } from "ton";
import { tryFetchLockup } from './tryFetchLockup';

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('tryFetchLockup', () => {
    it.each([
        ['Ef8HMTeopCIkmGDuCa9k-PTrw6kDkRFBJ-9FyG13RWIVxj9b'],
        ['EQBssrVneKhvXOz8GQ0AN31f7XthnxHBT-SgiIdXZ6MhqF1Q'],
        ['EQCbN9ywQaK31u4M-f4fkVCxAel_6Bw2z_QzebBG9fXL3s7T'],
        ['Ef860HV6PwDqXvoBZSjz_FxG1CKXt7TNzlAX_Ug72T3VU3VO']
    ])('should fetch lockup data', async (address: string) => {
        let isLockup = await tryFetchLockup(client, 27344070, Address.parse(address));
        expect(isLockup).toBeTruthy();
    });
});