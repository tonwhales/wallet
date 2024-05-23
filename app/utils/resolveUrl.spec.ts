import { Address } from "@ton/core";
import { resolveUrl, isUrl, normalizeUrl } from "./resolveUrl";

describe('resolveUrl', () => {
    it('should handle plain address', () => {
        let res = resolveUrl('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();

        res = resolveUrl('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N <invalid>', true)!;
        expect(res).toBeNull();
    });

    it('should handle ton links', () => {
        let res = resolveUrl('ton://transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();

        res = resolveUrl('ton://transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('ton://TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('ton://TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&TEXT=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');
    });

    it('should handle http links', () => {
        let res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();


        res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&TEXT=helloworld', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');
    });

    it('should resolve app links', () => {
        let res = resolveUrl('https://test.tonhub.com/app/te6cckEBAgEAIgABAUABADhodHRwczovL3RvbndoYWxlcy5jb20vbWluaW5nmeEl1g', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'install') {
            throw Error();
        }
        expect(res.customImage).toBeNull();
        expect(res.customTitle).toBeNull();
        expect(res.url).toEqual('https://tonwhales.com/mining');


        res = resolveUrl('https://test.tonhub.com/app/te6cckEBAwEALwACAcgCAQAUVE9OIE1pbmluZwA4aHR0cHM6Ly90b253aGFsZXMuY29tL21pbmluZ0Rcm2w', true)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'install') {
            throw Error();
        }
        expect(res.customImage).toBeNull();
        expect(res.customTitle).toEqual('TON Mining');
        expect(res.url).toEqual('https://tonwhales.com/mining');
    });
});

describe('isUrl', () => {
    it('should check urls', () => {
        expect(isUrl('https://google.com')).toBe(true);
        expect(isUrl('https://google.com/')).toBe(true);
        expect(isUrl('http://google.com')).toBe(true);
        expect(isUrl('https://tonwhales.com')).toBe(true);
        expect(isUrl('https://apps.tonhub.com')).toBe(true);
        expect(isUrl('google.com')).toBe(false);
        expect(isUrl('skldfkj_,e.az1.xom')).toBe(false);
        expect(isUrl('//app.aaaaaa.com')).toBe(false);
        expect(isUrl('app.evaa.finance')).toBe(false);
        expect(isUrl('https://app.evaa.finance')).toBe(true);
    });

    describe('should normalize urls', () => {
        let urls = [
            'example.com',
            '//example.com',
            'ftp://example.com',
            'http://example.com',
            'https://example.com',
            'https://example.com/',
            'https://example.com/qwer?asd=123',
            'https://example.com/asd/qwe?zxc=123#xxx',
            'https://example.com/asd/qwe/?zxc=123#xxx',
            'https://example.com:8080/asd/qwe?zxc=123#xxx',
            'https://example.com/qwer?asd=123://456',
            'http://EXAMPLE.com',
            'http://EXAMPLE.com/QWERTY',
            'HTTP://EXAMPLE.com/QWERTY',
            'HTTPS://EXAMPLE.COM:8080/ASD/qwe?ZXC=123#XXX',
            'ton://transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
            'https://t.me/toncoin?address=EQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqB38_&utm_source=tonhub&utm_content=extension&ref=tonhub&lang=ru&currency=USD&themeStyle=dark&theme-style=dark&theme=holders&pushNotifications=true&refId=browser-banner-27'
        ];


        for (let url of urls) {
            it(url, () => {
                expect(normalizeUrl(url)).not.toBeNull();
            });
        }
    });
});