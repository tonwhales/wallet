import axios from 'axios';
import { zenPayEndpoint } from '../../corp/ZenPayProduct';

export async function fetchAccountState(token: string) {
    let res = await axios.post(
        'https://' + zenPayEndpoint + '/account/state',
        { token }
    );
    
    if (!res.data.ok) {
        throw Error('Failed to fetch card token');
    }
    return res.data.state as { state: 'need-phone' | 'ok' | 'need-kyc' | 'no-ref' };
}