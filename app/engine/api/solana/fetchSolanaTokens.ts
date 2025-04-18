import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

const solanaTokenResponseSchema = z.array(z.object({
    decimals: z.number(),
    freezeAuthority: z.string().nullish(),
    isInitialized: z.boolean().nullish(),
    mintAuthority: z.string().nullish(),
    supply: z.string().nullish(),
    chainId: z.number(),
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    logoURI: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    extensions: z.object({
        blog: z.string().nullish(),
        coingeckoId: z.string().nullish(),
        serumV3Usdt: z.string().nullish(),
        website: z.string().nullish(),
    }).nullish(),
    amount: z.string(),
    uiAmount: z.number().nullish(),
    uiAmountString: z.string().nullish()
}));

export type SolanaToken = z.infer<typeof solanaTokenResponseSchema>[number];

export const fetchSolanaTokens = async (address: string, isTestnet: boolean) => {
    const network = isTestnet ? 'devnet' : 'mainnet';
    const url = `${whalesConnectEndpoint}/solana/tokens/${network}`;
    const res = await axios.post(url, { address });
    const result = solanaTokenResponseSchema.safeParse(res.data);

    if (!result.success) {
        throw new Error(`Invalid response: ${JSON.stringify(result.error)}`);
    }

    return result.data;
};
