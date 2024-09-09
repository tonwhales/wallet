import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";
import { z } from "zod";

const cardCredentialsCodec = z.object({
    id: z.string(),
    lastFourDigits: z.string(),
    title: z.string(),
    cardholderName: z.string(),
    address: z.string().optional(),
    assetName: z.string().optional(),
    assetUrl: z.string().optional(),
});

const applePayCredentialsCodecRes = z.union([
    z.object({
        ok: z.literal(false),
        error: z.string(),
    }),
    z.object({
        ok: z.literal(true),
        cards: z.array(cardCredentialsCodec),
    })
]);

export async function fetchApplePayCredentials(token: string, isTestnet: boolean) {
    const endpoint = holdersEndpoint(isTestnet);

    let res = await axios.post(
        `https://${endpoint}/v2/card/provisioning/list`,
        { token },
    );

    const parsed = applePayCredentialsCodecRes.safeParse(res.data);

    if (!parsed.success) {
        console.warn('Failed to parse apple pay credentials response', parsed.error);
        return null;
    }

    if (!parsed.data.ok) {
        return null;
    }

    return parsed.data.cards;
}