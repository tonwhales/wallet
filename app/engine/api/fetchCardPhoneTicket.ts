import axios from 'axios';
import { AppConfig } from '../../AppConfig';

export async function fetchCardPhoneTicket(token: string, phoneNumber: string) {
    let res = await axios.post('https://card.whales-api.com/phone/start', { token });
    if (!res.data.ok) {
        throw Error('Failed to fetch card token');
    }
    console.warn(res.data);
}