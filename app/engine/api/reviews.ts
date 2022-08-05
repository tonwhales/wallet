import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import * as t from 'io-ts';

export type CommentInput = {
    text: string,
    images: string[],
}

export type ReportInput = {
    id?: string | null
    address: string,
    type: 'scam' | 'spam' | 'bug' | 'offense',
    comment: CommentInput
}

export type ReviewInput = {
    id?: string | null
    rating: number,
    address: string,
    comment: CommentInput | null,
}

export const commentCodec = t.type({
    text: t.string,
    images: t.array(t.string),
    originalText: t.string
});

const reviewCodec = t.type({
    review: t.union([
        t.type(
            {
                id: t.string,
                address: t.string,
                rating: t.number,
                createdAt: t.string,
                updatedAt: t.string,
                comment: t.union([
                    t.null,
                    commentCodec
                ])
            }
        ),
        t.null
    ])
});

const reportCodec = t.type({
    report: t.literal('ok')
});

export async function fetchExtensionReview(address: Address, url: string) {
    let res = await axios.get('https://connect.tonhubapi.com/review/' + address.toFriendly({ testOnly: AppConfig.isTestnet, urlSafe: true }) + '/' + encodeURIComponent(url), { timeout: 5000 });

    if (!reviewCodec.is(res.data)) {
        throw Error('Error fetching a review');
    }

    return res.data.review;
}

export async function postExtensionReview(url: string, review: ReviewInput) {
    let res = await axios.post('https://connect.tonhubapi.com/review/', { url, input: review });

    if (!reviewCodec.is(res.data)) {
        throw Error('Error posting a review');
    }
    return res.data.review;
}

export async function postExtensionReport(url: string, report: ReportInput) {
    let res = await axios.post('https://tonhub-extensions-server-ogl9i.ondigitalocean.app/report', { url, input: report });

    if (!reportCodec.is(res.data)) {
        throw Error('Error posting a report');
    }
    return res.data.report;
}