import axios from 'axios';
import { holdersEndpoint } from '../../holders/HoldersProduct';
import * as t from "io-ts";

export type AccountState = t.TypeOf<typeof accountStateCodec>;

export type AccountStateRes = { ok: boolean, state: AccountState };

export const accountStateCodec = t.union([
    t.type({
        state: t.literal('need-kyc'),
        kycStatus: t.union([
            t.null,
            t.type({
                applicantStatus: t.union([
                    t.union([
                        t.type({ review: t.type({ reviewStatus: t.string, }) }),
                        t.null,
                        t.undefined
                    ]),
                    t.undefined,
                    t.null
                ]),
            }),
        ]),
        notificationSettings: t.type({
            enabled: t.boolean,
        }),
        suspended: t.boolean,
    }),
    t.type({
        state: t.union([
            t.literal('need-phone'),
            t.literal('ok'),
            t.literal('no-ref'),
            t.literal('need-email'),
        ]),
        notificationSettings: t.type({
            enabled: t.boolean,
        }),
        suspended: t.boolean,
    }),
]);

export const accountStateResCodec = t.type({
    ok: t.boolean,
    state: accountStateCodec,
});

export async function fetchAccountState(token: string) {
    let res = await axios.post(
        'https://' + holdersEndpoint + '/account/state',
        { token }
    );

    if (res.status === 401) {
        return null;
    }

    if (!res.data.ok) {
        throw Error('Failed to fetch account state');
    }

    return res.data.state as AccountState;
}