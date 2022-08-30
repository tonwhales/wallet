import axios from 'axios';

export async function fetchCardPhoneComplete(token: string, phoneNumber: string, signature: string) {
    let res = await axios.post('https://card.whales-api.com/phone/verify', { token, phoneNumber, signature });
    if (!res.data.ok) {
        throw Error('Failed to verify phone number');
    }
}