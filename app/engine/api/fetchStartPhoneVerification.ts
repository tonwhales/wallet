import axios from 'axios';

export async function fetchStartPhoneVerification(token: string, phoneNumber: string, sig: string, expires: number) {
    let res = await axios.post('https://phone.whales-api.com/auth/start', { token, phoneNumber, title: 'Tonhub', sig, expires });
    if (res.data.result !== 'ok') {
        if (res.data.result === 'invalid_number') {
            return { state: 'invalid_number' as const };
        }
        if (res.data.result === 'try_again_later') {
            return { state: 'try_again_later' as const }
        }
        throw Error('Unable to request phone verification');
    }

    return { state: 'ok' as const, id: res.data.id as string };
}