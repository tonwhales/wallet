import axios from "axios";
import { whalesConnectEndpoint } from "../clients";

export type PriceState = {
    price: { usd: number },
    rates: { [key: string]: number },
    solanaPrice?: { usd: number }
}

export async function fetchPrice(): Promise<PriceState> {
    const res = await axios.get(`${whalesConnectEndpoint}/v2/price`, { method: 'GET' });
    return res.data as PriceState;
};