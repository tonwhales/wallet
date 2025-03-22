import axios from "axios";

export type PriceState = {
    price: { usd: number },
    rates: { [key: string]: number },
    solanaPrice?: { usd: number }
}

export async function fetchPrice(): Promise<PriceState> {
    return ((await axios.get('https://connect.tonhubapi.com/v2/price', { method: 'GET' })).data as PriceState);
};