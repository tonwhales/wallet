import { Address } from "@ton/core";
import axios from "axios";
import * as t from 'io-ts';

export type CommentInput = {
    text: string,
    images: string[],
}

export type ReportInput = {
    address: string,
    type: 'scam' | 'spam' | 'bug' | 'offense',
    comment: CommentInput
}

export type ReviewInput = {
    rating: number,
    address: string,
    comment: CommentInput | null,
}

export const commentCodec = t.type({
    text: t.string,
    images: t.array(t.string),
});

const reviewCodec = t.type({
    review: t.union([
        t.type({
            address: t.string,
            rating: t.number,
            createdAt: t.number,
            updatedAt: t.number,
            comment: t.union([t.null, commentCodec])
        }),
        t.null
    ])
});

const reportCodec = t.type({
    report: t.type({
        _id: t.string,
        url: t.string,
        address: t.string,
        type: t.keyof({ // using for better performance instead of t.union([t.literal('scam'), t.literal('spam')])
            scam: null,
            spam: null,
            bug: null,
            offense: null
        }),
        createdAt: t.number,
        comment: t.union([t.null, commentCodec])
    })
});

export const imagePreviewCodec = t.type({
    blurhash: t.string,
    preview256: t.string
});

export const appDataCodec = t.type({
    title: t.string,
    url: t.string,
    color: t.union([t.string, t.null]),
    description: t.union([t.string, t.null]),
    image: t.union([imagePreviewCodec, t.null]),
    originalImage: t.union([t.string, t.null]),
    extension: t.union([t.string, t.null])
});

export const reportsSummaryCodec = t.type({
    spam: t.number,
    scam: t.number,
    bug: t.number,
    offense: t.number
});

export const extensionStatsCodec = t.union([
    t.type({
        url: t.string,
        metadata: t.union([appDataCodec, t.null]),
        verified: t.boolean,
        reportsSummary: reportsSummaryCodec,
        rating: t.number,
        reviewsCount: t.number
    }),
    t.type({
        url: t.string,
        metadata: t.union([appDataCodec, t.null]),
        reportsSummary: reportsSummaryCodec,
        rating: t.number,
        reviewsCount: t.number
    })
]);

export const extensionResCodec = t.type({
    extension: extensionStatsCodec
});

export type ExtensionStats = t.TypeOf<typeof extensionStatsCodec>;

export async function fetchExtensionStats(url: string) {
    const res = await axios.get(`https://connect.tonhubapi.com/apps/catalog`, { params: { url: encodeURIComponent(url) } });

    if (!extensionResCodec.is(res.data)) {
        throw Error('Error fetching extension');
    }

    return res.data.extension;
}

export async function fetchExtensionReview(address: Address, url: string, isTestnet: boolean) {
    let res = await axios.get('https://connect.tonhubapi.com/apps/reviews' + `?url=${encodeURIComponent(url)}&address=${address.toString({ testOnly: isTestnet, urlSafe: true })}`, { timeout: 5000 });

    if (!reviewCodec.is(res.data)) {
        throw Error('Error fetching a review');
    }

    return res.data.review;
}

export async function postExtensionReview(url: string, review: ReviewInput) {
    let res = await axios.post('https://connect.tonhubapi.com/apps/reviews', { url, input: review });

    if (!reviewCodec.is(res.data)) {
        throw Error('Error posting a review');
    }
    return res.data.review;
}

export async function postExtensionReport(url: string, report: ReportInput) {
    let res = await axios.post('https://connect.tonhubapi.com/apps/reports', { url, input: report });

    if (!reportCodec.is(res.data)) {
        throw Error('Error posting a report');
    }
    return res.data.report;
}