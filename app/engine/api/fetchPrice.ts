import axios from "axios";

export type PriceState = {
    price: {
        usd: number,
        rates: { [key: string]: number }
    }
}

export async function fetchPrice(): Promise<PriceState> {
    return ((await axios.get('https://connect.tonhubapi.com/price', { method: 'GET' })).data as PriceState);
};