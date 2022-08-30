import axios from 'axios';

export async function fetchCardPhoneTicket(token: string, phoneNumber: string) {
    let res = await axios.post('https://card.whales-api.com/phone/start', { token, phoneNumber });
    if (!res.data.ok) {
        if (res.data.status === 'invalid_number') {
            return { status: 'invalid_number' as const };
        }
        throw Error('Failed to fetch card token');
    }
    if (res.data.status !== 'ok') {
        if (res.data.status === 'already_verified') {
            return { status: 'already_verified' as const };
        } else {
            throw Error('Failed to fetch card token');
        }
    }
    return res.data as { phoneNumber: string, expires: number, signature: string, status: 'ok', token: string }
}