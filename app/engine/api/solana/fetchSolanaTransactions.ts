import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";

const txScheme = z.object({
    description: z.string(),
    type: z.string(),
    source: z.string(),
    fee: z.number(),
    feePayer: z.string(),
    signature: z.string(),
    slot: z.number(),
    timestamp: z.number(),
    tokenTransfers: z.array(z.object({
        fromTokenAccount: z.string(),
        toTokenAccount: z.string(),
        fromUserAccount: z.string(),
        mint: z.string(),
        tokenAmount: z.number(),
        tokenStandard: z.string()
    })),
    nativeTransfers: z.array(z.object({
        fromUserAccount: z.string(),
        toUserAccount: z.string(),
        amount: z.number(),
    })),
    accountData: z.array(z.object({
        account: z.string(),
        nativeBalanceChange: z.number(),
        tokenBalanceChanges: z.array(z.object({
            userAccount: z.string(),
            tokenAccount: z.string(),
            rawTokenAmount: z.object({
                amount: z.number().optional(),
                decimals: z.number().optional(),
                uiAmount: z.number().optional(),
                uiAmountString: z.string().optional(),
            }).optional(),
        })),
    })),
    transactionError: z.string().nullable(),
    instructions: z.array(z.object({
        accounts: z.array(z.string()),
        data: z.string(),
        programId: z.string(),
        innerInstructions: z.array(z.object({
            accounts: z.array(z.string()),
            data: z.string(),
            programId: z.string(),
            innerInstructions: z.array(z.object({
                accounts: z.array(z.string()),
                data: z.string(),
                programId: z.string(),
                innerInstructions: z.array(z.object({
                    accounts: z.array(z.string()),
                    data: z.string(),
                    programId: z.string(),
                })).optional(),
            })).optional(),
        })),
    })),
});

export type SolanaTx = z.infer<typeof txScheme>;

const txResponseScheme = z.array(txScheme);

export type SolanaTransactionsQuery = { limit?: number, before?: string, until?: string, commitment?: string, source?: string, type?: string, mint?: string };

export async function fetchSolanaTransactions(address: string, isTestnet: boolean, query: SolanaTransactionsQuery) {
    const network = isTestnet ? "devnet" : "mainnet";
    const endpoint = `${whalesConnectEndpoint}/solana/transactions/${address}/${network}`;
    const url = new URL(endpoint);
    Object.entries(query).forEach(([key, value]) => {
        if (!!value) {
            url.searchParams.set(key, value.toString());
        }
    });
    const response = await axios.get(url.toString());
    return txResponseScheme.parse(response.data);
}