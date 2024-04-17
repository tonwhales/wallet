import axios from "axios";
import { z } from "zod";

const knownJettonTickersCodec = z.array(z.string());

export async function fetchKnownJettonTickers() {
    try {
        const res = await axios.get("https://raw.githubusercontent.com/tonwhales/wallet/master/assets/knownJettonTickers.json");

        if (res.status === 200) {
            const parsed = knownJettonTickersCodec.safeParse(res.data);

            if (parsed.success) {
                return parsed.data;
            }

            console.warn('Failed to parse known jetton tickers', parsed.error);
        }

        return [];
    } catch {
        console.warn('Failed to fetch known jetton tickers');
        return [];
    }
}
