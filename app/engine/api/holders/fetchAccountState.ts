import axios from 'axios';
import { holdersEndpoint } from '../../corp/HoldersProduct';
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

// {"ok":true,"state":{"state":"need-kyc","kycStatus":{"kind":"sumsub","applicantId":"64468525bd352a63a6310ae8","applicantStatus":{"id":"64468525bd352a63a6310ae8","createdAt":"2023-04-24 13:33:25","key":"CWVGFSQACMHRKB","clientId":"walleexer.com_58544","inspectionId":"64468525bd352a63a6310ae9","externalUserId":"corp:clg6lyojc000zvq02damgwwnf","info":{"firstName":"ולדיסלב","firstNameEn":"wldyslb","lastName":"ז'ובניטסקי","lastNameEn":"zwbnytsqy","dob":"1994-12-08","country":"ISR","idDocs":[{"idDocType":"ID_CARD","country":"ISR","firstName":"ולדיסלב","firstNameEn":"wldyslb","lastName":"ז'ובניטסקי","lastNameEn":"zwbnytsqy","validUntil":"2033-04-24","number":"347759458","dob":"1994-12-08","ocrDocTypes":null,"imageFieldsInfo":null}]},"applicantPlatform":"Web","ipCountry":"ISR","agreement":{"createdAt":"2023-04-24 13:33:32","source":"WebSDK","targets":["constConsentEn_v6"],"content":null,"link":null,"privacyNoticeUrl":null},"requiredIdDocs":{"docSets":[{"idDocSetType":"IDENTITY","types":["DRIVERS","ID_CARD","RESIDENCE_PERMIT","PASSPORT"],"videoRequired":"docapture","captureMode":"manualAndAuto","uploaderMode":"always"},{"idDocSetType":"SELFIE","types":["SELFIE"],"videoRequired":"passiveLiveness"}]},"review":{"reviewId":"eboHg","attemptId":"FcHhQ","attemptCnt":0,"elapsedSincePendingMs":46089,"elapsedSinceQueuedMs":46089,"levelName":"card-demo","createDate":"2023-06-09 17:00:47+0000","reviewDate":"2023-06-09 17:01:33+0000","reviewReasonCode":"deepGeneralTier","moderationTierType":null,"reviewResult":{"reviewAnswer":"RED","reviewRejectType":"RETRY"},"reviewStatus":"prechecked","priority":0,"moderatorNames":null},"lang":"ru","type":"individual"}},"notificationSettings":{"enabled":true}}}

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
                        idDocs: t.array(
                            t.type({
                                idDocType: t.string,
                                country: t.string,
                                firstName: t.string,
                                firstNameEn: t.string,
                                lastName: t.string,
                                lastNameEn: t.string,
                                validUntil: t.string,
                                number: t.string,
                                dob: t.string,
                                ocrDocTypes: t.null,
                                imageFieldsInfo: t.null,
                            })
                        ),
                    }),
                    applicantPlatform: t.string,
                    ipCountry: t.string,
                    agreement: t.type({
                        createdAt: t.string,
                        source: t.string,
                        targets: t.array(t.string),
                        content: t.null,
                        link: t.null,
                        privacyNoticeUrl: t.null,
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

    console.log(JSON.stringify(res.data));

    if (!accountStateResCodec.is(res.data.state)) {
        throw Error('Invalid account response');
    }

    return res.data.state as AccountState;
}