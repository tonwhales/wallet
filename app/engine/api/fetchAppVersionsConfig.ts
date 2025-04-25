import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

export const appVersionsScheme = z.object({
    ios: z.object({
        critical: z.string(),
        latest: z.string(),
        url: z.string()
    }),
    android: z.object({
        critical: z.string(),
        latest: z.string(),
        url: z.string()
    })
});

const appVersionsDatedScheme = z.intersection(
    appVersionsScheme,
    z.object({
        createdAt: z.number(),
        updatedAt: z.number()
    })
);

export type AppVersionsConfig = z.infer<typeof appVersionsDatedScheme>;

export async function fetchAppVersionsConfig(isTestnet: boolean): Promise<AppVersionsConfig | null> {
    const res = await axios.get(
        `${whalesConnectEndpoint}/appconfig/versions/${isTestnet ? 'testnet' : 'mainnet'}`,
        { timeout: 5000 }
    );

    const parsed = appVersionsDatedScheme.safeParse(res.data);

    if (!parsed.success) {
        return null;
    }

    return parsed.data;
}