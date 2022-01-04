import { Address } from "ton";
import { resolveUrl } from "./resolveUrl";

describe('resolveUrl', () => {
    it('should handle plain address', () => {
        let res = resolveUrl('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();

        res = resolveUrl('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N <invalid>')!;
        expect(res).toBeNull();
    });

    it('should handle ton links', () => {
        let res = resolveUrl('ton://transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();

        res = resolveUrl('ton://transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('ton://TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('ton://TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&TEXT=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');
    });

    it('should handle http links', () => {
        let res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();


        res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&TEXT=helloworld')!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');
    });
});