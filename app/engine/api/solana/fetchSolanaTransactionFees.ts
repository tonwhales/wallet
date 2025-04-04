import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";
import { z } from "zod";

const feesCodec = z.object({ value: z.number() });

export async function fetchSolanaTransactionFees(transaction: string, isTestnet: boolean) {
    const network = isTestnet ? 'devnet' : 'mainnet';
    const url = `${whalesConnectEndpoint}/solana/transaction/fees/${network}`;
    const res = await axios.post(url, { transaction });
    return feesCodec.parse(res.data);
}