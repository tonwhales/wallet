import axios from "axios";
import { z } from "zod";

const appConfigCodec = z.object({
    txTimeout: z.number(),
    features: z.record(z.boolean()).optional(),
});

export type AppConfig = z.infer<typeof appConfigCodec>;

export async function fetchAppConfig(isTestnet: boolean) {
    const res = await axios.get(
        `https://connect.tonhubapi.com/appconfig/${isTestnet ? 'testnet' : 'mainnet'}`,
        { timeout: 5000 }
    );

    const parsed = appConfigCodec.safeParse(res.data);

    if (!parsed.success) {
        return null;
    }

    return parsed.data;
}