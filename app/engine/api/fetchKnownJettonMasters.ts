import axios from "axios";
import { z } from "zod";

const knownJettonTickersCodec = z.object({
    testnet: z.record(z.object({})),
    mainnet: z.record(z.object({})),
});

export async function fetchKnownJettonMasters() {
    try {
        const res = await axios.get("https://github.com/tonwhales/wallet/tree/master/assets/knownJettonMasters.json");

        if (res.status === 200) {
            const parsed = knownJettonTickersCodec.safeParse(res.data);

            if (parsed.success) {
                return parsed.data;
            }

            console.warn('Failed to parse known jetton masters', parsed.error);
        }

        return { testnet: {}, mainnet: {} };
    } catch {
        console.warn('Failed to fetch known jetton masters');
        return { testnet: {}, mainnet: {} };
    }
}