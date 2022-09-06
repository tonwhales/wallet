import axios from 'axios';

export async function fetchIDVerify(token: string) {
    let res = await axios.post('https://card.whales-api.com/id/verify', { token });
    if (!res.data.ok) {
        throw Error('Invalid request')
    }
}