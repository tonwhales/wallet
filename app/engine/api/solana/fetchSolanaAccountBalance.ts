import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

const solanaBalanceResponseSchema = z.object({
    balance: z.string(),
    address: z.string()
});

export const fetchSolanaAccountBalance = async (address: string, isTestnet: boolean) => {
    const network = isTestnet ? 'devnet' : 'mainnet';
    const url = `${whalesConnectEndpoint}/solana/account/${network}`;
    const res = await axios.post(url, { address });
    const result = solanaBalanceResponseSchema.safeParse(res.data);

    if (!result.success) {
        throw new Error(`Invalid response: ${JSON.stringify(result.error)}`);
    }

    const balance = BigInt(result.data.balance);

    return {
        balance,
        address: result.data.address
    };
};