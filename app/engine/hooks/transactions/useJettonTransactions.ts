import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { useNetwork } from '..';
import { log } from '../../../utils/log';
import { fetchJettonTransactions } from '../../api/fetchJettonTransactions';
import { queryClient } from '../../clients';

const TRANSACTIONS_LENGTH = 16;

export type JettonTransfer = {
    query_id: string,
    source: string,
    destination: string,
    amount: string,
    source_wallet: string,
    jetton_master: string,
    transaction_hash: string,
    transaction_lt: string,
    transaction_now: number,
    transaction_aborted: boolean,
    response_destination: string,
    custom_payload: string | null,
    forward_ton_amount: string,
    forward_payload: string | null,
    trace_id: string
}

export function useJettonTransactions(owner: string, master: string, options: { refetchOnMount: boolean } = { refetchOnMount: false }) {
    const { isTestnet } = useNetwork();

    const query = useInfiniteQuery<JettonTransfer[]>({
        queryKey: Queries.Jettons().Address(owner).Transactions(master),
        refetchOnMount: options.refetchOnMount,
        getNextPageParam: (last) => {
            if (!last || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            return {
                lt: last[last.length - 1].transaction_lt,
                hash: last[last.length - 1].transaction_hash
            };
        },
        queryFn: async (ctx) => {
            let lt: string | undefined;
            let hash: string | undefined;
            let sliceFirst: boolean = false;

            if (ctx.pageParam?.lt && ctx.pageParam?.hash) {
                lt = ctx.pageParam.lt;
                hash = ctx.pageParam.hash;
                sliceFirst = true;
            }

            log(`[jetton-txns-query] fetching ${lt}_${hash} ${sliceFirst ? 'sliceFirst' : ''}`);

            let txs = await fetchJettonTransactions(owner, master, isTestnet, { lt, hash, limit: TRANSACTIONS_LENGTH });

            if (sliceFirst) {
                txs = txs.slice(1);
            }

            if (!lt && !hash) {
                queryClient.refetchQueries({ queryKey: Queries.HintsFull(owner) });
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
            if (firstOld[0]?.transaction_lt === firstNext[0]?.transaction_lt && firstOld[0]?.transaction_hash === firstNext[0]?.transaction_hash) {
                return next;
            }

            // Something changed, rebuild the list
            let offset = firstNext.findIndex(a => a.transaction_lt === firstOld![0].transaction_lt && a.transaction_hash === firstOld![0].transaction_hash);

            // If not found, we need to invalidate the whole list
            if (offset === -1) {
                return {
                    pageParams: [next.pageParams[0]],
                    pages: [next.pages[0]],
                };
            }

            // If found, we need to shift pages and pageParams
            let pages: JettonTransfer[][] = [next.pages[0]];
            let pageParams: ({ lt: string, hash: string } | undefined)[] = [next.pageParams[0] as any];
            let tail = old!.pages[0].slice(TRANSACTIONS_LENGTH - offset);
            let nextPageParams = { hash: next.pages[0][next.pages[0].length - 1].transaction_hash, lt: next.pages[0][next.pages[0].length - 1].transaction_lt };

            for (let page of old!.pages.slice(1)) {
                let newPage = tail.concat(page.slice(0, TRANSACTIONS_LENGTH - 1 - offset));
                pageParams.push(nextPageParams);
                pages.push(newPage);

                tail = page.slice(TRANSACTIONS_LENGTH - 1 - offset);
                nextPageParams = { hash: newPage[newPage.length - 1].transaction_hash, lt: newPage[newPage.length - 1].transaction_lt };
            }

            return { pages, pageParams };
        },
    });

    return {
        data: query.data?.pages.flat(),
        next: () => {
            if (!query.isFetchingNextPage && !query.isFetching && query.hasNextPage) {
                query.fetchNextPage();
            }
        },
        refresh: () => {
            query.refetch({ refetchPage: (last, index, allPages) => index == 0 });
        },
        hasNext: !!query.hasNextPage,
        loading: query.isFetching,
    };
}