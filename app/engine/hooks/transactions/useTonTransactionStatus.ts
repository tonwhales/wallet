import { useQuery } from '@tanstack/react-query';
import { fetchTonTransactionStatus } from '../../api/transactions/fetchTonTransactionStatus';
import { Queries } from '../../queries';

export function useTonTransactionStatus(txHash: string, network: 'mainnet' | 'testnet') {
	return useQuery({
		queryKey: Queries.TransactionStatus(txHash, network),
		queryFn: () => fetchTonTransactionStatus(txHash, network),
		cacheTime: 60 * 1000,
		refetchInterval: 6000,
		staleTime: 3000
	});
}
