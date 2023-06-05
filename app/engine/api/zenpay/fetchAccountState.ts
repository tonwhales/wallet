import axios from 'axios';
import { zenPayEndpoint } from '../../corp/ZenPayProduct';
import * as t from "io-ts";

export type AccountState =
    | { state: 'need-phone' | 'ok' | 'no-ref' }
    | {
        state: 'need-kyc', kycStatus: {
            kind: string;
            applicantId: string;
            applicantStatus: {
                id: string;
                createdAt: string;
                key: string;
                clientId: string;
                inspectionId: string;
                externalUserId: string;
                applicantPlatform: string;
                requiredIdDocs: {
                    docSets: {
                        idDocSetType: string;
                        types: string[];
                        videoRequired: string;
                        captureMode: string;
                        uploaderMode: string;
                    }[];
                };
                review: {
                    reviewId: string;
                    attemptId: string;
                    attemptCnt: number;
                    levelName: string;
                    createDate: string;
                    reviewStatus: string;
                    priority: number;
                };
                lang: string;
                type: string;
            };
        } | null;
    }

export type AccountStateRes = {
    ok: boolean;
    state: AccountState
};

export const accountStateCodec =
    t.union([
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
                        applicantPlatform: t.string,
                        requiredIdDocs: t.type({
                            docSets: t.array(t.type({
                                idDocSetType: t.string,
                                types: t.array(t.string),
                                videoRequired: t.string,
                                captureMode: t.string,
                                uploaderMode: t.string,
                            })),
                        }),
                        review: t.type({
                            reviewId: t.string,
                            attemptId: t.string,
                            attemptCnt: t.number,
                            levelName: t.string,
                            createDate: t.string,
                            reviewStatus: t.string,
                            priority: t.number,
                        }),
                        lang: t.string,
                        type: t.string,
                    }),
                }),
            ]),
        }),
        t.type({ state: t.union([t.literal('need-phone'), t.literal('ok'), t.literal('no-ref')]) })
    ]);

export const accountStateResCodec = t.type({
    ok: t.boolean,
    state: accountStateCodec
});

export async function fetchAccountState(token: string) {
    let res = await axios.post(
        'https://' + zenPayEndpoint + '/account/state',
        { token }
    );

    if (res.status === 401) {
        return null;
    }

    if (!res.data.ok) {
        throw Error('Failed to fetch account state');
    }

    if (!accountStateResCodec.is(res.data)) {
        throw Error('Invalid account response');
    }

    return res.data.state as AccountState;
}