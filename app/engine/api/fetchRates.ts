import axios from "axios";
import { whalesConnectEndpoint } from "../clients";

export async function fetchRates({ isTestnet, tokens, currencies }: { isTestnet: boolean, tokens: string[], currencies: string[] }): Promise<PriceState> {
    const res = await axios.post(`${whalesConnectEndpoint}/v2/rates`, {
        network: isTestnet ? 'testnet' : 'mainnet',
        tokens,
        currencies
    });
    return res.data;
};