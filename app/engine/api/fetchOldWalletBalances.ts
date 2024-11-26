import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { z } from "zod";

const accountScheme = z.object({
    address: z.string(),
    balance: z.object({
        coins: z.string()
    }),
    state: z.union([
        z.object({
            type: z.literal('uninit')
        }),
        z.object({
            type: z.literal('active'),
            codeHash: z.string(),
            dataHash: z.string()
        }),
        z.object({
            type: z.literal('frozen'),
            stateHash: z.string()
        })
    ]),
    last: z.object({
        lt: z.string(),
        hash: z.string()
    }).nullable(),
    storageStat: z.object({
        lastPaid: z.number(),
        duePayment: z.string().nullable(),
        used: z.object({
            bits: z.number(),
            cells: z.number(),
            publicCells: z.number()
        })
    }).nullable()
});

const oldWalletBalancesSheme = z.object({
    totalBalance: z.string(),
    accounts: z.array(accountScheme)
})

export async function fetchOldWalletBalances(pubkey: Buffer) {
    const url = `${whalesConnectEndpoint}/balances/old/${encodeURIComponent(pubkey.toString('hex'))}`;
    const res = await axios.get(url);
    
    const parsed = oldWalletBalancesSheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid response');
    }

    return parsed.data;
}