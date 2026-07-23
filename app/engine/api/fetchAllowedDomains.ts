import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const allowedDomainsCodec = z.object({
    domains: z.array(z.string())
});

export type AllowedDomains = z.infer<typeof allowedDomainsCodec>;

export async function fetchAllowedDomains(): Promise<AllowedDomains | null> {
    try {
        const res = await axios.get(`${whalesConnectEndpoint}/protect/allowed-domains`);

        if (res.status === 200) {
            const parsed = allowedDomainsCodec.safeParse(res.data);

            if (parsed.success) {
                return parsed.data;
            }

            console.warn('Failed to parse allowed domains config', parsed.error);
        }

        return null;
    } catch {
        return null;
    }
}

