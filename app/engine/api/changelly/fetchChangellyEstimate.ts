import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

const ChangellyEstimateResultSchema = z.object({
    amountFrom: z.string(),
    amountTo: z.string(),
    networkFee: z.string(),
    from: z.string(),
    rate: z.string(),
    to: z.string(),
    max: z.string(),
    maxFrom: z.string(),
    maxTo: z.string(),
    min: z.string(),
    minFrom: z.string(),
    minTo: z.string(),
    visibleAmount: z.string(),
    fee: z.string(),
});

const ChangellyEstimateResponseSchema = z.object({
    id: z.string(),
    jsonrpc: z.string(),
    result: z.array(ChangellyEstimateResultSchema),
});

export type ChangellyEstimateResult = z.infer<typeof ChangellyEstimateResultSchema>;
export type ChangellyEstimateResponse = z.infer<typeof ChangellyEstimateResponseSchema>;

export type ChangellyLimits = {
    max: {
        from: string;
        to: string;
    };
    min: {
        from: string;
        to: string;
    };
};

export type ChangellyLimitType = 'min' | 'max';

export class ChangellyLimitError extends Error {
    public limits: ChangellyLimits;
    public errorCode: string;
    public limitType: ChangellyLimitType;

    constructor(message: string, limits: ChangellyLimits, limitType: ChangellyLimitType, errorCode: string = 'changelly_api_error') {
        super(message);
        this.name = 'ChangellyLimitError';
        this.limits = limits;
        this.limitType = limitType;
        this.errorCode = errorCode;
    }
}

export async function fetchChangellyEstimate(
    toCurrency: string,
    fromCurrency: string,
    amount: string
): Promise<ChangellyEstimateResult | undefined> {
    const url = `${whalesConnectEndpoint}/changelly/estimate`;

    try {
        const res = await axios.post<ChangellyEstimateResponse>(`${url}`, {
            toCurrency,
            fromCurrency,
            amount,
        });

        if (res.status !== 200) {
            return undefined;
        }

        const validatedData = ChangellyEstimateResponseSchema.safeParse(res.data);
        if (!validatedData.success) {
            return undefined;
        }

        return validatedData.data.result[0];
    } catch (error: any) {
        // Check if error contains limits information
        if (error.response?.data?.ok === false && error.response?.data?.limits) {
            const errorData = error.response.data;
            const errorMessage = errorData.message || '';

            // Determine limit type from error message
            const limitType: ChangellyLimitType = errorMessage.toLowerCase().includes('minimal') || errorMessage.toLowerCase().includes('minimum')
                ? 'min'
                : 'max';

            throw new ChangellyLimitError(
                errorMessage || 'Amount exceeds limits',
                errorData.limits,
                limitType,
                errorData.error
            );
        }

        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }

        if (error.message) {
            throw new Error(error.message);
        }

        throw new Error('Unknown error occurred');
    }
}