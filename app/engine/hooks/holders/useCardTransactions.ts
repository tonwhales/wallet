import { useInfiniteQuery } from "@tanstack/react-query";
import { CardNotification, fetchCardsTransactions } from "../../api/holders/fetchCardsTransactions";
import { Queries } from "../../queries";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersAccountState } from "../../api/holders/fetchAccountState";

export function useCardTransactions(address: string, id: string) {
    let status = useHoldersAccountStatus(address).data;

    return useInfiniteQuery<{
        hasMore: boolean;
        lastCursor: string;
        data: CardNotification[];
    } | null>({
        queryKey: Queries.Holders(address).Notifications(id),
        getNextPageParam: (last) => {
            if (!last?.lastCursor) {
                return null;
            }

            return {
                lastCursor: last.lastCursor,
            };
        },
        queryFn: async (ctx) => {
            if (!!status && status.state !== HoldersAccountState.NeedEnrollment) {
                const cardRes = await fetchCardsTransactions(status.token, id, 40, ctx.pageParam?.lastCursor, 'desc');
                if (!!cardRes) {
                    return cardRes;
                }
            }
            return null;
        },
        staleTime: Infinity,
    });
}