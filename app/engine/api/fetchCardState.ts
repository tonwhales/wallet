import axios from 'axios';

export async function fetchCardState(token: string) {
    console.log('fetchCardState', { token });
    let res = await axios.post('https://card.whales-api.com/account/state', { token });
    console.log('fetchCardState', { res })
    if (!res.data.ok) {
        throw Error('Failed to fetch card token');
    }
    return res.data.state as { state: 'need-phone' | 'ok' | 'need-kyc' };
}