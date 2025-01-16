import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address } from '@ton/core';
import { StoredTransaction } from '../../types';
import { fetchAccountTransactions } from '../../api/fetchAccountTransactions';
import { useClient4, useNetwork } from '..';
import { getLastBlock } from '../../accountWatcher';
import { log } from '../../../utils/log';
import { addTxHints } from '../jettons/useHints';
import { queryClient } from '../../clients';

const TRANSACTIONS_LENGTH = 16;

export function useRawAccountTransactions(account: string, options: { refetchOnMount: boolean } = { refetchOnMount: false }) {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    let query = useInfiniteQuery<StoredTransaction[]>({
        queryKey: Queries.Transactions(account),
        refetchOnMount: options.refetchOnMount,
        refetchOnWindowFocus: true,
        getNextPageParam: (last) => {
            if (!last || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            return {
                lt: last[last.length - 1].lt,
                hash: last[last.length - 1].hash,
            };
        },
        queryFn: async (ctx) => {
            let accountAddr = Address.parse(account);
            let lt: string;
            let hash: string;
            let sliceFirst: boolean = false;

            if (ctx.pageParam?.lt && ctx.pageParam?.hash) {
                lt = ctx.pageParam.lt;
                hash = ctx.pageParam.hash;
                sliceFirst = true;
            } else {
                let accountLite = await client.getAccountLite(await getLastBlock(), accountAddr);
                if (!accountLite.account.last) {
                    return [];
                }

                lt = accountLite.account.last.lt;
                hash = accountLite.account.last.hash;
            }

            log(`[txns-query] fetching ${lt}_${hash} ${sliceFirst ? 'sliceFirst' : ''}`);

            let txs = await fetchAccountTransactions(accountAddr, isTestnet, { lt, hash });
            let shouldRefetchJttons = false;

            // Add jetton wallets to hints (in case of hits worker lag being to high)
            const txHints = txs
                .filter(tx => {
                    const isIn = tx.parsed.kind === 'in';
                    const isJetton = tx.operation.items.length > 0
                        ? tx.operation.items[0].kind === 'token'
                        : false;

                        if (!shouldRefetchJttons && isJetton) {
                            shouldRefetchJttons = true;
                        }

                    return isIn && isJetton;
                })
                .map(tx => tx.parsed.mentioned)
                .flat();

            addTxHints(account, txHints);

            if (sliceFirst) {
                txs = txs.slice(1);
            }

            log(`[txns-query] fetched ${txs.length} txs`);

            if (shouldRefetchJttons) {
                queryClient.refetchQueries({ queryKey: Queries.HintsFull(account) });
            }

            return txs;
        },
        structuralSharing: (old, next) => {
            let firstOld = old?.pages[0];
            let firstNext = next?.pages[0];

            // If something absent
            if (!firstOld || !firstNext) {
                return next;
            }

            if (firstOld.length < 1 || firstNext.length < 1) {
                return next;
            }

            // If first elements are equal
            if (firstOld[0]?.lt === firstNext[0]?.lt && firstOld[0]?.hash === firstNext[0]?.hash) {
                return next;
            }

            // Something changed, rebuild the list
            let offset = firstNext.findIndex(a => a.lt === firstOld![0].lt && a.hash === firstOld![0].hash);

            // If not found, we need to invalidate the whole list
            if (offset === -1) {
                return {
                    pageParams: [next.pageParams[0]],
                    pages: [next.pages[0]],
                };
            }

            // If found, we need to shift pages and pageParams
            let pages: StoredTransaction[][] = [next.pages[0]];
            let pageParams: ({ lt: string, hash: string } | undefined)[] = [next.pageParams[0] as any];
            let tail = old!.pages[0].slice(TRANSACTIONS_LENGTH - offset);
            let nextPageParams = { hash: next.pages[0][next.pages[0].length - 1].hash, lt: next.pages[0][next.pages[0].length - 1].lt };

            for (let page of old!.pages.slice(1)) {
                let newPage = tail.concat(page.slice(0, TRANSACTIONS_LENGTH - 1 - offset));
                pageParams.push(nextPageParams);
                pages.push(newPage);

                tail = page.slice(TRANSACTIONS_LENGTH - 1 - offset);
                nextPageParams = { hash: newPage[newPage.length - 1].hash, lt: newPage[newPage.length - 1].lt };
            }

            return { pages, pageParams };
        },
        staleTime: 5 * 1000
    });

    return query;
}