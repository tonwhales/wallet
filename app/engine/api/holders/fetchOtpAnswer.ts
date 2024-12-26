import axios from "axios";
import { z } from "zod";
import { holdersEndpoint } from "./fetchUserState";

export const otpRequestConfirmationCodec = z.object({
    id: z.string(),
    status: z.enum(['REJECTED', 'CONFIRMED'])
});
export type OtpRequestConfirmation = z.infer<typeof otpRequestConfirmationCodec>;

const otpAnswerResultCodec = z.union([
    z.object({
        ok: z.literal(false),
        error: z.enum([
            'not_confirmation_type',
            'expired',
            'already_rejected',
            'already_confirmed',
            'disabled_for_provider'
        ]),
    }),
    z.object({
        ok: z.literal(true),
    })
]);

export type OtpAnswerResult = z.infer<typeof otpAnswerResultCodec>;

export async function fetchOtpAnswer(params: { token: string, id: string, accept: boolean, isTestnet: boolean }): Promise<OtpAnswerResult> {
    const { token, id, accept, isTestnet } = params;
    const url = `${holdersEndpoint(isTestnet)}/user/otp/requests/${id}/confirm`;

    const res = await axios.post(url, {
        token,
        data: { id, status: accept ? 'CONFIRMED' : 'REJECTED' }
    });

    if (res.status !== 200) {
        throw Error('Unable to request phone verification');
    }

    const parsed = otpAnswerResultCodec.safeParse(res.data);

    if (!parsed.success) {
        throw new Error(`Failed to parse response: ${parsed.error.errors}`);
    }

    return parsed.data
}