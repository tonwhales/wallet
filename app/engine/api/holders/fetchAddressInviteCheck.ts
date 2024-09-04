import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";
import { z } from "zod";
import { Address } from "@ton/core";

const inviteCheckCodec = z.object({
    allowed: z.boolean(),
});

export async function fetchAddressInviteCheck(address: string, isTestnet: boolean) {
    const endpoint = holdersEndpoint(isTestnet);
    const formattedAddress = Address.parse(address).toString({ testOnly: isTestnet });

    const res = await axios.post(`https://${endpoint}/v2/invite/wallet/check`, { wallet: formattedAddress });

    const parsed = inviteCheckCodec.safeParse(res.data);

    if (!parsed.success) {
        console.warn('Failed to parse invite check response', parsed.error);
        return false;
    }

    return parsed.data.allowed;
}