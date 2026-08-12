import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const platformVersionsScheme = z.object({
    // Below this version the app is unusable and shows a non-dismissable update dialog.
    // Optional: older configs have no minimal version, which means no hard update at all
    minimal: z.string().optional(),
    critical: z.string(),
    latest: z.string(),
    url: z.string()
});

export const appVersionsScheme = z.object({
    ios: platformVersionsScheme,
    android: platformVersionsScheme
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