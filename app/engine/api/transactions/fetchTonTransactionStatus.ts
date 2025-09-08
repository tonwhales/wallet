import axios from 'axios';
import { z } from 'zod';
import { whalesConnectEndpoint } from '../../clients';

const tonTransactionStatusScheme = z.object({
	timestamp: z.number().optional(),
	lt: z.string().optional(),
	inProgress: z.boolean().optional(),
	found: z.boolean()
});

export type TonTransactionStatus = z.infer<typeof tonTransactionStatusScheme>;

const tonTransactionStatusResponseScheme = tonTransactionStatusScheme.nullable();

export async function fetchTonTransactionStatus(
	txHash: string,
	network: 'mainnet' | 'testnet'
): Promise<TonTransactionStatus | null> {
	const response = await axios.post(`${whalesConnectEndpoint}/ton/transactions/status/${network}`, {
		txHash
	});
	return tonTransactionStatusResponseScheme.parse(response.data);
}
