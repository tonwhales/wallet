import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const browserAlertTextsSchema = z.record(z.object({ message: z.string() }));

const appConfigCodec = z.object({
    txTimeout: z.number(),
    features: z.record(z.boolean()).optional(),
    browserAlerTexts: browserAlertTextsSchema.nullish(),
});

export type AppConfig = z.infer<typeof appConfigCodec>;

export async function fetchAppConfig(isTestnet: boolean) {
    const res = await axios.get(
        `${whalesConnectEndpoint}/appconfig/${isTestnet ? 'testnet' : 'mainnet'}`,
        { timeout: 5000 }
    );

    const parsed = appConfigCodec.safeParse(res.data);

    if (!parsed.success) {
        return null;
    }

    return parsed.data;
}