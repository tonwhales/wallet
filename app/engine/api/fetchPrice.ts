import axios from "axios";
import { PriceState } from "../products/PriceProduct";

export async function fetchPrice(): Promise<PriceState> {
    return ((await axios.get('https://connect.tonhubapi.com/price', { method: 'GET' })).data as PriceState);
};