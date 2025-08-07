import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";
import { Currency } from "../../types/deposit";

const ChangellyCurrencySchema = z.object({
    ticker: z.string(),
    name: z.string(),
    fullName: z.string(),
    image: z.string(),
    enabled: z.boolean(),
    decimals: z.number(),
    contractAddress: z.string().optional(),
    blockchain: z.string().optional(),
    network: z.string().optional(),
});

const ChangellyCurrenciesResponseSchema = z.array(ChangellyCurrencySchema);

export type ChangellyCurrency = z.infer<typeof ChangellyCurrencySchema>;
export type ChangellyCurrenciesResponse = z.infer<typeof ChangellyCurrenciesResponseSchema>;

export async function fetchChangellyCurrencies(currencyTo: Currency): Promise<ChangellyCurrenciesResponse | undefined> {
    const url = `${whalesConnectEndpoint}/changelly/currencies`;

    try {
        const res = await axios.get<ChangellyCurrenciesResponse>(`${url}?currencyTo=${currencyTo}`);
        
        if (res.status !== 200) {
            return undefined;
        }

        const validatedData = ChangellyCurrenciesResponseSchema.safeParse(res.data);
        if (!validatedData.success) {
            return undefined;
        }

        return validatedData.data;
    } catch (error) {
        return undefined;
    }
}