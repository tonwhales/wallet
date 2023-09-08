import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { Address, RawTransaction, TonClient4, parseTransaction } from 'ton';

export function useAccountTransactions(client: TonClient4, account: string) {
    let query = useInfiniteQuery<RawTransaction[]>({
        queryKey: Queries.Account(account).Transactions(),
        getNextPageParam: (last) => {
            return {
                lt: last,
                hash: last[0],
            };
        },
        queryFn: async (ctx) => {
            let txs = await client.getAccountTransactions(Address.parse(account), ctx.pageParam.lt, ctx.pageParam.hash);
            let raw = txs.map(a => parseTransaction(a.block.workchain, a.tx.beginParse()));
            return raw;
        }
    });

    if (!query.data) {
        return null;
    }

    return query;
}