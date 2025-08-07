import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";
import { changellyTransactionStatusCodec } from "./fetchChangellyUserTransactions";

export const changellyCreateTransactionCodec = z.object({
    _id: z.string(),
    id: z.string(),
    status: changellyTransactionStatusCodec,
    fromCurrency: z.string(),
    toCurrency: z.string(),
    amountFrom: z.string(),
    amountTo: z.string(),
    amountExpectedTo: z.string(),
    amountExpectedFrom: z.string(),
    exchangeFee: z.string(),
    rate: z.string(),
    payinAddress: z.string(),
    payoutAddress: z.string(),
    payinHash: z.string().nullable(),
    payoutHash: z.string().nullable(),
    networkFee: z.string(),
    changellyFee: z.string().nullable(),
    apiExtraFee: z.string(),
    totalFee: z.string(),
    refundAddress: z.string(),
    indempotencyKey: z.string(),
    requestParams: z.object({
        address: z.string(),
        amount: z.string(),
        from: z.string(),
        id: z.string(),
        refundAddress: z.string(),
        to: z.string(),
    }),
    createdAt: z.string().transform((str) => new Date(str)),
    updatedAt: z.string().transform((str) => new Date(str)),
    error: z.string().nullable(),
    wallet: z.string(),
});

export type ChangellyCreateTransaction = z.infer<typeof changellyCreateTransactionCodec>;

export type CreateChangellyTransactionBody = {
    fromCurrency: string;
    toCurrency: string;
    network: string;
    amount: string;
    idempotencyKey: string;
    wallet: string
}

export async function createChangellyTransaction(data: CreateChangellyTransactionBody): Promise<ChangellyCreateTransaction> {
    const url = `${whalesConnectEndpoint}/changelly/transaction/create`;
    
    try {
        const res = await axios.post(url, data);
        
        if (res.status !== 200) {
            throw new Error('Request failed');
        }

        const validatedData = changellyCreateTransactionCodec.safeParse(res.data);
        if (!validatedData.success) {
            throw new Error('Invalid response format');
        }

        return validatedData.data;
    } catch (error: any) {
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        
        if (error.message) {
            throw new Error(error.message);
        }
        
        throw new Error('Unknown error occurred');
    }
}