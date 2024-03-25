import { Address } from "@ton/core";
import { resolveBounceableTag } from "./resolveBounceableTag";

describe('resolveBounceableTag', () => {
    it('should resolve as false for wallet', async () => {
        const address = Address.parse('UQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqByL6');
        const res = await resolveBounceableTag(address, { testOnly: false, bounceableFormat: false });
        expect(res).toEqual(false);
    });
    it('should resolve as true for wallet', async () => {
        const address = Address.parse('UQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqByL6');
        const res = await resolveBounceableTag(address, { testOnly: false, bounceableFormat: true });
        expect(res).toEqual(true);
    });
    it('should resolve as true for jetton_wallet', async () => {
        const address = Address.parse('EQB1XyGQA3SvmznyXpAnbK7ZRAkZTK1sMs0Sq_M2wN-et29I');
        const res = await resolveBounceableTag(address, { testOnly: false, bounceableFormat: false });
        expect(res).toEqual(true);
    });
    it('should resolve as true for jetton_wallet', async () => {
        const address = Address.parse('EQB1XyGQA3SvmznyXpAnbK7ZRAkZTK1sMs0Sq_M2wN-et29I');
        const res = await resolveBounceableTag(address, { testOnly: false, bounceableFormat: true });
        expect(res).toEqual(true);
    });
});