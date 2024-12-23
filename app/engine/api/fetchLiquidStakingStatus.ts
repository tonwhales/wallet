import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { z } from "zod";

const statusScheme = z.object({
    rateDeposit: z.string(),
    rateWithdraw: z.string(),
    extras: z.object({
        minStake: z.string(),
        depositFee: z.string(),
        withdrawFee: z.string(),
        receiptPrice: z.string(),
        address: z.string(),
        enabled: z.boolean(),
        upgradable: z.boolean(),
        poolFee: z.number(),
        roundEnd: z.number(),
        proxyZeroStakeUntil: z.number(),
        proxyOneStakeUntil: z.number()
    }),
    balances: z.object({
        minterSupply: z.string(),
        totalBalance: z.string(),
        totalSent: z.string(),
        totalPendingWithdraw: z.string(),
        totalBalanceWithdraw: z.string()
    }),
    roundId: z.number()
}).nullish();

export async function fetchLiquidStakingStatus(isTestnet: boolean) {
    const url = `${whalesConnectEndpoint}/staking/${isTestnet ? 'testnet' : 'mainnet'}/pool/liquid/info`;
    const res = await axios.get(url);

    const parsed = statusScheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid response');
    }

    return parsed.data;
}