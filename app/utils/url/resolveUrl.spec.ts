import { Address, comment, toNano } from "@ton/core";
import { resolveUrl, isUrl, normalizeUrl } from "./resolveUrl";
import { ResolveUrlError } from "./types";

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
        let res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toBeNull();


        res = resolveUrl('https://tonhub.com/transfer/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&text=helloworld', false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        if (res.type !== 'transaction') {
            throw Error();
        }
        expect(res.address.equals(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'))).toBe(true);
        expect(res.comment).toEqual('helloworld');

        res = resolveUrl('https://tonhub.com/TRANSFER/EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N?amount=105000000000&TEXT=helloworld', false)!;
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


    it('should resolve jetton transfer', () => {
        const testUrlBase = `ton://transfer`;

        const address = 'UQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqByL6';
        const jettonMasterAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT master

        const jettonAmount = '10'; // 10.0 tokens
        const feeAmount = '5000000000';
        const forwardAmount = '1000000000';

        const invalidAmount = '1000000fd00.0';
        const invalidFeeAmount = '500000zz0fd00.0';
        const invalidForwardAmount = '100003zxz0000.0';
        const failedFeeAmount = '100000000';

        const payload = comment('test').toBoc({ idx: false }).toString('base64');
        const invalidPayload = 'invalid payload' + comment('test').toBoc({ idx: false }).toString('base64'); 

        const validUrl = `${testUrlBase}/${address}?amount=${jettonAmount}&fee-amount=${feeAmount}&forward-amount=${forwardAmount}&bin=${payload}&jetton=${jettonMasterAddress}`;
        const invalidAmountUrl = `${testUrlBase}/${address}?amount=${invalidAmount}&fee-amount=${feeAmount}&forward-amount=${forwardAmount}&bin=${payload}&jetton=${jettonMasterAddress}`;
        const invalidFeeAmountUrl = `${testUrlBase}/${address}?amount=${jettonAmount}&fee-amount=${invalidFeeAmount}&forward-amount=${forwardAmount}&bin=${payload}&jetton=${jettonMasterAddress}`;
        const invalidForwardAmountUrl = `${testUrlBase}/${address}?amount=${jettonAmount}&fee-amount=${feeAmount}&forward-amount=${invalidForwardAmount}&bin=${payload}&jetton=${jettonMasterAddress}`;
        const failedFeeAmountUrl = `${testUrlBase}/${address}?amount=${jettonAmount}&fee-amount=${failedFeeAmount}&forward-amount=${forwardAmount}&bin=${payload}&jetton=${jettonMasterAddress}`;
        const invalidPayloadUrl = `${testUrlBase}/${address}?amount=${jettonAmount}&fee-amount=${feeAmount}&forward-amount=${forwardAmount}&bin=${invalidPayload}&jetton=${jettonMasterAddress}`;

        let res = resolveUrl(validUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();

        if (res.type !== 'jetton-transaction') {
            throw Error();
        }

        expect(res.address.equals(Address.parse(address))).toBe(true);
        expect(res.amount).toEqual(toNano(jettonAmount.replace(',', '.').replaceAll(' ', '')));
        expect(res.feeAmount).toEqual(BigInt(feeAmount));
        expect(res.forwardAmount).toEqual(BigInt(forwardAmount));
        expect(res.payload?.toBoc({ idx: false }).toString('base64')).toEqual(payload);
        expect(res.jettonMaster.equals(Address.parse(jettonMasterAddress))).toBe(true);

        // Invalid amount
        res = resolveUrl(invalidAmountUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.type).toEqual('error');

        if (res.type === 'error') {
            expect(res.error).toEqual(ResolveUrlError.InvalidAmount);
        } else {
            throw Error();
        }

        // Invalid fee amount
        res = resolveUrl(invalidFeeAmountUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.type).toEqual('error');

        if (res.type === 'error') {
            expect(res.error).toEqual(ResolveUrlError.InvalidJettonFee);
        } else {
            throw Error();
        }

        // Invalid forward amount
        res = resolveUrl(invalidForwardAmountUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.type).toEqual('error');

        if (res.type === 'error') {
            expect(res.error).toEqual(ResolveUrlError.InvalidJettonForward);
        } else {
            throw Error();
        }

        // Failed amounts
        res = resolveUrl(failedFeeAmountUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.type).toEqual('error');

        if (res.type === 'error') {
            expect(res.error).toEqual(ResolveUrlError.InvalidJettonAmounts);
        } else {
            throw Error();
        }

        // Invalid payload
        res = resolveUrl(invalidPayloadUrl, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.type).toEqual('error');

        if (res.type === 'error') {
            expect(res.error).toEqual(ResolveUrlError.InvalidPayload);
        } else {
            throw Error();
        }
    });

    it('should resolve bin transfer', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve exp transfer', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&exp=174000000';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve dns transfer', () => {
        const url = 'ton://transfer/subbotin.ton?amount=1';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve jetton transfer', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve jetton transfer with bin', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid exp', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&exp=1796015245';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid init', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\=';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve jetton transfer with valid text', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&text=test';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid text comment', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&text=test';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid init and bin', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\=&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid init and text', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w\=\=&text=test';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
    });

    it('should resolve transfer with valid bin and text', () => {
        const url = 'ton://transfer/UQDNzlh0XSZdb5_Qrlx5QjyZHVAO74v5oMeVVrtF_5Vt1rIt?amount=1&text=test&bin=te6ccgEBAQEANwAAaV0r640BleSq4Ql3m5OrdlSApYTNRMdDGUFXwTpwZ1oe1G8cPlS_Zym8CwoAdO4mWSned-Fg';
        const res = resolveUrl(url, false)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
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
        let validUrls = [
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

        let invalidUrls = [
            'dsjfklj":///fks;lkc',
            'это не ссылка',
            'this is not a link',
            '##$#@!##',
            'https://',
            'http://'
        ];

        for (let url of validUrls) {
            it(url, () => {
                expect(normalizeUrl(url)).not.toBeNull();
            });
        }

        for (let url of invalidUrls) {
            it(url, () => {
                expect(normalizeUrl(url)).toBeNull();
            });
        }
    });
});