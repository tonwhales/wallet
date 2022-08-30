import axios from 'axios';

export async function fetchCompletePhoneVerification(token: string, code: string) {
    let res = await axios.post('https://phone.whales-api.com/auth/verify', { id: token, code });
    if (res.data.result !== 'ok') {
        if (res.data.result === 'expired') {
            return { state: 'expired' as const };
        }
        if (res.data.result === 'invalid_code') {
            return { state: 'invalid_code' as const }
        }
        throw Error('Unable to request phone verification');
    }

    return { state: 'ok' as const, signature: res.data.signature as string };
}