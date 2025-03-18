import axios from "axios";
import { whalesConnectEndpoint } from "../../clients";
import { z } from "zod";

const solanaTransactionErrorScheme = z.union([
    z.record(z.string(), z.any()),
    z.string()
]);

const signatureStatusScheme = z.object({
    slot: z.number(),
    confirmations: z.number().nullable(),
    err: z.any().nullable(),
    confirmationStatus: z.enum(['processed', 'confirmed', 'finalized']).nullable(),
});

export type SolanaTransactionStatus = z.infer<typeof signatureStatusScheme>;

const signatureStatusResponseScheme = signatureStatusScheme.nullable();

export async function fetchSolanaTransactionStatus(signature: string, network: 'mainnet' | 'devnet'): Promise<SolanaTransactionStatus | null> {
    const response = await axios.get(`${whalesConnectEndpoint}/solana/transaction/${signature}?network=${network}`);
    return signatureStatusResponseScheme.parse(response.data);
}