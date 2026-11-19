import axios from 'axios';
import { flagsCodec } from './flagsCodec';

describe('flagsCodec', () => {
    it('accepts boolean and variant values', () => {
        const parsed = flagsCodec.safeParse({ flags: { a: true, b: 'own' }, rev: 'c51e4909a6e3', ttl: 60 });
        expect(parsed.success).toBe(true);
    });

    it('rejects malformed responses', () => {
        expect(flagsCodec.safeParse({ flags: { a: 1 }, rev: 'x', ttl: 60 }).success).toBe(false);
        expect(flagsCodec.safeParse({ flags: {}, rev: 'x', ttl: 0 }).success).toBe(false);
        expect(flagsCodec.safeParse({ flags: {} }).success).toBe(false);
    });
});

const contractUrl = process.env.FLAGS_CONTRACT_URL;

(contractUrl ? describe : describe.skip)('whales-connect /flags contract', () => {
    it('serves a response the client codec accepts', async () => {
        const res = await axios.post(`${contractUrl}/flags`, {
            network: 'testnet',
            addresses: ['EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2'],
            appVersion: '4.2.0',
            platform: 'ios'
        });
        const parsed = flagsCodec.safeParse(res.data);
        expect(parsed.success).toBe(true);
        expect(res.headers['cache-control']).toBe('private, no-store');
    });
});
