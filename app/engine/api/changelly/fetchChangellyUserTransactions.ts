import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

export const changellyTransactionStatusCodec = z.union([
    z.literal('new'),
    z.literal('waiting'),
    z.literal('confirming'),
    z.literal('exchanging'),
    z.literal('sending'),
    z.literal('finished'),
    z.literal('failed'),
    z.literal('refunded'),
    z.literal('hold'),
    z.literal('expired'),
    z.literal('overdue'),
    z.literal('resolved')
]);

export const changellyTransactionCodec = z.object({
    id: z.string(),
    status: changellyTransactionStatusCodec,
    description: z.string().nullable(),
    network: z.string().nullable(),
    fromCurrency: z.string(),
    toCurrency: z.string(),
    amountFrom: z.string().nullable(),
    amountTo: z.string().nullable(),
    amountExpectedTo: z.string().nullable(),
    amountExpectedFrom: z.string().nullable(),
    exchangeRate: z.string().nullable(),
    payinAddress: z.string(),
    payoutAddress: z.string(),
    payinHash: z.string().nullable(),
    payoutHash: z.string().nullable(),
    networkFee: z.string().nullable(),
    changellyFee: z.string().nullable(),
    apiExtraFee: z.string().nullable(),
    totalFee: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    error: z.string().nullable(),
    expiresAt: z.string()
});

const successResponseSchema = z.object({
    ok: z.literal(true),
    data: z.array(changellyTransactionCodec)
});

const errorResponseSchema = z.object({
    ok: z.literal(false),
    error: z.string(),
    message: z.string()
});

const responseSchema = z.union([successResponseSchema, errorResponseSchema]);

export type ChangellyTransactionModel = z.infer<typeof changellyTransactionCodec>;
export type ChangellyTransactionStatus = z.infer<typeof changellyTransactionStatusCodec>;

export type FetchChangellyUserTransactionsParams = {
    limit?: number;
    offset?: number;
    status?: ChangellyTransactionStatus;
    wallet: {
        ton: string;
        solana?: string;
    };
};

export type FetchChangellyUserTransactionsResponse = 
    | { ok: true; data: ChangellyTransactionModel[] }
    | { ok: false; error: string; message: string };

export async function fetchChangellyUserTransactions(
    params: FetchChangellyUserTransactionsParams
): Promise<FetchChangellyUserTransactionsResponse | undefined> {
    const url = `${whalesConnectEndpoint}/changelly/transactions`;
    
    try {
        const res = await axios.post(url, params);
        
        if (res.status !== 200) {
            return undefined;
        }

        const validatedData = responseSchema.safeParse(res.data);
        if (!validatedData.success) {
            return undefined;
        }

        return validatedData.data;
    } catch (error) {
        return undefined;
    }
}