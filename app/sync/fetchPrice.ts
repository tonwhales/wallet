import axios from "axios";

export interface PriceState {
    price: {
        usd: number
    }
}

export async function fetchPrice(): Promise<PriceState> {
    return ((await axios.get('https://connect.tonhubapi.com/price', { method: 'GET' })).data as PriceState);
};