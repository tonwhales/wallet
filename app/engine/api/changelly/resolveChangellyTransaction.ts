import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

const successResponseSchema = z.object({
    ok: z.literal(true),
});

const errorResponseSchema = z.object({
    ok: z.literal(false),
    error: z.string(),
    message: z.string()
});

const responseSchema = z.union([successResponseSchema, errorResponseSchema]);

export type ResolveChangellyTransactionBody = {
    wallet: string;
    transactionId: string;
}

export type ResolveChangellyTransactionResponse = 
    | { ok: true }
    | { ok: false; error: string; message: string };

export async function resolveChangellyTransaction(data: ResolveChangellyTransactionBody): Promise<void> {
    const url = `${whalesConnectEndpoint}/changelly/transaction/resolve`;
    
    try {
        const res = await axios.post(url, data);
        
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
        
        return;
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