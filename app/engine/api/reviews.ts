import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
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

export async function fetchExtensionReview(address: Address, url: string) {
    let res = await axios.get('https://connect.tonhubapi.com/apps/reviews' + `?url=${encodeURIComponent(url)}&address=${address.toFriendly({ testOnly: AppConfig.isTestnet, urlSafe: true })}`, { timeout: 5000 });

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