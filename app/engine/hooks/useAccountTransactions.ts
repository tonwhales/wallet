import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { Clients } from '../clients';
import { useMemo } from 'react';
import { Address, RawTransaction, parseTransaction } from 'ton';

export function useAccountTransactions(account: string): any[] {
    return [];
    // const client = isTestnet ? Clients.ton.testnet : Clients.ton.mainnet;

    // return useInfiniteQuery<RawTransaction[]>({
    //     queryKey: Queries.Account(account).Transactions(),
    //     getNextPageParam: (last) => {
    //         return {
    //             lt: last,
    //             hash: last.hash,
    //         };
    //     },
    //     async queryFn(ctx) {
    //         let txs = await client.getAccountTransactions(Address.parse(account), ctx.pageParam.lt, ctx.pageParam.hash);
    //         let raw =  txs.map(a => parseTransaction(a.block.workchain, a.tx.beginParse()));
    //         return raw;
    //     }
    // });
}