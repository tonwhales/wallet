import axios from "axios";
import { z } from "zod";

const jettonPayloadScheme = z.object({
    customPayload: z.string().optional().nullable(),
    stateInit: z.string().optional().nullable()
});

export type JettonPayload = z.infer<typeof jettonPayloadScheme>;

export async function fetchJettonPayload(account: string, jettonMaster: string, customPayloadApiUri?: string | null): Promise<JettonPayload> {
    const endpoint = `https://connect.tonhubapi.com/mintless/jettons/`;
    const path = `${jettonMaster}/transfer/${account}/payload`;

    const searchParams = new URLSearchParams();
    if (customPayloadApiUri) {
        searchParams.append('customPayloadApiUri', customPayloadApiUri);
    }
    const search = searchParams.toString();
    const url = `${endpoint}${path}${search ? `?${search}` : ''}`;
    const res = (await axios.get(url)).data;

    const parsed = jettonPayloadScheme.safeParse(res);

    if (!parsed.success) {
        throw Error('Invalid jetton payload');
    }

    return parsed.data;
}