import axios from 'axios';
import { AppConfig } from '../../AppConfig';

export async function fetchCardState(token: string) {
    let res = await axios.post('https://card.whales-api.com/account/state', { token });
    if (!res.data.ok) {
        throw Error('Failed to fetch card token');
    }
    return res.data.state as { state: 'need-phone' };
}