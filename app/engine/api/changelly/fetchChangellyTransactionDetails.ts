import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";
import { changellyTransactionCodec, ChangellyTransactionModel } from "./fetchChangellyUserTransactions";


const successResponseSchema = z.object({
    ok: z.literal(true),
    data: changellyTransactionCodec
});

const errorResponseSchema = z.object({
    ok: z.literal(false),
    error: z.string(),
    message: z.string()
});

const responseSchema = z.union([successResponseSchema, errorResponseSchema]);

export type fetchChangellyTransactionDetailsParams = {
    transactionId: string;
};

export type fetchChangellyTransactionDetailsResponse = 
    | { ok: true; data: ChangellyTransactionModel }
    | { ok: false; error: string; message: string };

export async function fetchChangellyTransactionDetails(
    params: fetchChangellyTransactionDetailsParams
): Promise<ChangellyTransactionModel> {
    const url = `${whalesConnectEndpoint}/changelly/transaction/details`;

    try {
        const res = await axios.post(url, params);
        
        if (res.status !== 200) {
            throw new Error('Request failed');
        }

        const validatedData = responseSchema.safeParse(res.data);
        if (!validatedData.success) {
            throw new Error('Invalid response format');
        }

        if (!validatedData.data.ok) {
            throw new Error(validatedData.data.error);
        }

        return validatedData.data.data;
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