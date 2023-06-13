import axios from 'axios';
import { holdersEndpoint } from '../../corp/HoldersProduct';
import * as t from "io-ts";

export type AccountState = t.TypeOf<typeof accountStateCodec>;

export type AccountStateRes = { ok: boolean, state: AccountState };

export const accountStateCodec = t.union([
    t.type({
        state: t.literal('need-kyc'),
        kycStatus: t.union([
            t.null,
            t.type({
                kind: t.string,
                applicantId: t.string,
                applicantStatus: t.type({
                    id: t.string,
                    createdAt: t.string,
                    key: t.string,
                    clientId: t.string,
                    inspectionId: t.string,
                    externalUserId: t.string,
                    info: t.type({
                        firstName: t.string,
                        firstNameEn: t.string,
                        lastName: t.string,
                        lastNameEn: t.string,
                        dob: t.string,
                        country: t.string,
                    }),
                    applicantPlatform: t.string,
                    ipCountry: t.string,
                    agreement: t.type({
                        createdAt: t.string,
                        source: t.string,
                        targets: t.array(t.string),
                    }),
                    requiredIdDocs: t.type({
                        docSets: t.array(
                            t.type({
                                idDocSetType: t.string,
                                types: t.array(t.string),
                                videoRequired: t.string,
                                captureMode: t.string,
                                uploaderMode: t.string,
                            })
                        ),
                    }),
                    review: t.type({
                        reviewStatus: t.string,
                    }),
                }),
            }),
        ]),
        notificationSettings: t.type({
            enabled: t.boolean,
        }),
    }),
    t.type({
        state: t.union([
            t.literal('need-phone'),
            t.literal('ok'),
            t.literal('no-ref'),
        ]),
        notificationSettings: t.type({
            enabled: t.boolean,
        }),
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