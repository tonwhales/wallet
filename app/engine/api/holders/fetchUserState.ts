import axios from 'axios';
import { z } from 'zod';

export const holdersEndpointStage = 'card-staging.whales-api.com';
export const holdersUrlStage = 'https://stage.holders.io';
// export const holdersUrlStage = 'https://tonhub-stage.holders.io';

export const holdersEndpointProd = 'card-prod.whales-api.com';
export const holdersUrlProd = 'https://tonhub.holders.io';

export const holdersEndpoint = (isTestnet: boolean) => isTestnet ? holdersEndpointStage : holdersEndpointProd;
export const holdersUrl = (isTestnet: boolean) => isTestnet ? holdersUrlStage : holdersUrlProd;

export type UserState = z.infer<typeof userStateCodec>;

export type UserStateRes = { ok: boolean, state: UserState };

export enum HoldersUserState {
    NeedEnrollment = 'need-enrollment',
    NeedPhone = 'need-phone',
    NoRef = 'no-ref',
    NeedKyc = 'need-kyc',
    NeedEmail = 'need-email',
    Ok = 'ok',
}

export const userStateCodec = z.union([
    z.object({
        state: z.union([
            z.literal(HoldersUserState.NeedPhone),
            z.literal(HoldersUserState.NoRef),
        ]),
    }),
    z.object({
        state: z.literal(HoldersUserState.NeedKyc),
        kycStatus: z.union([
            z.null(),
            z.object({
                applicantStatus: z.union([
                    z.union([
                        z.object({ review: z.object({ reviewStatus: z.string() }) }),
                        z.null(),
                        z.undefined()
                    ]),
                    z.undefined(),
                    z.null()
                ]),
                completed: z.boolean().nullish(),
                result: z.union([
                    z.literal('GREEN'),
                    z.literal('RED'),
                ]).nullish(),
            }),
        ]),
        notificationSettings: z.object({
            enabled: z.boolean(),
        }),
        suspended: z.boolean(),
    }),
    z.object({
        state: z.union([
            z.literal(HoldersUserState.Ok),
            z.literal(HoldersUserState.NeedEmail),
            z.literal(HoldersUserState.NeedPhone),
        ]),
        notificationSettings: z.object({
            enabled: z.boolean(),
        }),
        suspended: z.boolean(),
    }),
]);

export const userStateResCodec = z.object({
    ok: z.boolean(),
    state: userStateCodec,
});

export async function fetchUserState(token: string, isTestnet: boolean): Promise<UserState | null> {
    const endpoint = isTestnet ? holdersEndpointStage : holdersEndpointProd;
    const res = await axios.post(`https://${endpoint}/account/state`, { token });

    if (res.status === 401) {
        return null;
    }

    if (!res.data.ok) {
        throw Error('Failed to fetch account state');
    }

    return res.data.state as UserState;
}