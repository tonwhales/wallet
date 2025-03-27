import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";
import { z } from "zod";

const ibanPromoResultCodec = z.union([
    z.object({
        ok: z.literal(false),
        error: z.string()
    }),
    z.object({
        ok: z.literal(true),
        enabled: z.boolean()
    })
]);

export type IbanPromoResult = z.infer<typeof ibanPromoResultCodec>;

export const fetchIbanPromo = async (token: string, isTestnet: boolean): Promise<IbanPromoResult> => {
    const endpoint = holdersEndpoint(isTestnet);

    const res = await axios.post(`https://${endpoint}/v2/promo/iban`, { token });
    
    const parsed = ibanPromoResultCodec.safeParse(res.data);

    if (!parsed.success) {
        throw Error('Failed to fetch IBAN promo');
    }

    return parsed.data
}; 