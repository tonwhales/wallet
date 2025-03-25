import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";
import { z } from "zod";

const feesCodec = z.object({ value: z.number() });

export async function fetchSolanaTransactionFees(transaction: string, isTestnet: boolean) {
    const network = isTestnet ? 'devnet' : 'mainnet';
    const url = `${whalesConnectEndpoint}/solana/transaction/fees/${network}`;
    console.log('fetchSolanaTransactionFees', url);
    const res = await axios.post(url, { transaction });
    console.log('fetchSolanaTransactionFees', res.data);
    return feesCodec.parse(res.data);
}