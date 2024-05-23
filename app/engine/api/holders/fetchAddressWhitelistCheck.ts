import axios from "axios";
import { holdersEndpoint } from "./fetchAccountState";
import { z } from "zod";

const whitelistCheckCodec = z.object({
    allowed: z.boolean(),
});

export async function fetchAddressWhitelistCheck(address: string, isTestnet: boolean) {
    const endpoint = holdersEndpoint(isTestnet);
    const res = await axios.post(`https://${endpoint}/v2/whitelist/wallet/check`, { wallet: address });

    const parsed = whitelistCheckCodec.safeParse(res.data);

    if (!parsed.success) {
        console.warn('Failed to parse whitelist check response', parsed.error);
        return false;
    }

    return parsed.data.allowed;
}