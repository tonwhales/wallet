import axios from "axios";
import { z } from "zod";

const usdtMasterCodec = z.object({
    testnet: z.string().nullable().optional(),
    mainnet: z.string().nullable().optional(),
});

type USDTMaster = z.infer<typeof usdtMasterCodec>;

export async function fetchUSDTMaster(): Promise<USDTMaster> {
    try {
        const res = await axios.get("https://github.com/tonwhales/wallet/tree/master/assets/jettons/usdtMaster.json");

        if (res.status === 200) {
            const parsed = usdtMasterCodec.safeParse(res.data);

            if (parsed.success) {
                return parsed.data;
            }

            console.warn('Failed to parse usdt master address', parsed.error);
        }

        return {
            testnet: null,
            mainnet: null,
        };
    } catch {
        console.warn('Failed to fetch usdt master address');
        return {
            testnet: null,
            mainnet: null,
        };
    }
}