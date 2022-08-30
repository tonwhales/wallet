import axios from 'axios';

export async function fetchIDStart(token: string) {
    let res = await axios.post('https://card.whales-api.com/id/start', { token });
    return res.data as { token: string }
}