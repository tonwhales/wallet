import { z } from "zod";
import { holdersEndpoint } from "./fetchUserState";
import axios from "axios";

export const merchantInfoCodec = z.object({
    dirtyName: z.string(),
    cleanName: z.string().optional(),
    logo: z.string().nullish(),
    logoUrl: z.string().nullish(),
    country: z.string().nullish(),
    city: z.string().nullish(),
    merchantId: z.string().nullish(),
    placeId: z.string().nullish(),
    mccCode: z.string().nullish(),
    category: z.string().nullish(),
});

const otpObjectInfoCodec = z.object({
    txnId: z.string(),
    expiresAt: z.string().optional(),
    merchant: merchantInfoCodec.optional(),
});

const otpCodeCodec = z.object({
    type: z.literal('otp_code'),
    code: z.string(),
    amount: z.string(),
    currency: z.string(),
});

const activationCodeCodec = z.object({
    type: z.literal('activation_code'),
    code: z.string(),
});

const confirmationObjectCodec = z.object({
    type: z.literal('confirmation_request'),
    amount: z.string(),
    currency: z.string(),
});

export const inappOtpObjectCodec = z.union([
    otpCodeCodec.and(otpObjectInfoCodec),
    activationCodeCodec.and(otpObjectInfoCodec),
    confirmationObjectCodec.and(otpObjectInfoCodec),
]);

const otpResultCodecBase = z.object({
    cardId: z.string(),
    accountId: z.string(),
    status: z.enum([
        "CONFIRMED",
        "PENDING",
        "REJECTED"
    ]).optional()
});

export const inappOtpCodec = inappOtpObjectCodec.and(otpResultCodecBase);
export const inappOtpResultCodec = z.object({
    ok: z.boolean(),
    data: inappOtpCodec,
});

export type InappOtp = z.infer<typeof inappOtpCodec>;

export async function fetchPaymentOtp(token: string, isTestnet: boolean): Promise<InappOtp | null> {
    const url = `https://${holdersEndpoint(isTestnet)}/v2/user/otp/requests`;

    const res = await axios.post(url, { token });

    if (res.status === 401) {
        return null;
    }

    const parsed = inappOtpResultCodec.safeParse(res.data);

    if (!parsed.success) {
        throw new Error(`Failed to parse response: ${JSON.stringify(parsed.error.errors)}`);
    }

    return parsed.data.data;
}