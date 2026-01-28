import { useInfiniteQuery } from "@tanstack/react-query";
import { CardNotification, fetchCardsTransactions } from "../../api/holders/fetchCardsTransactions";
import { Queries } from "../../queries";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersUserState } from "../../api/holders/fetchUserState";
import axios from "axios";
import { deleteHoldersToken } from "../../../storage/holders";
import { saveErrorLog } from "../../../storage";

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
            if (!!status && status.state !== HoldersUserState.NeedEnrollment) {
                try {
                    const cardRes = await fetchCardsTransactions(status.token, id, 40, ctx.pageParam?.lastCursor, 'desc');

                    if (!cardRes) {
                        deleteHoldersToken(address);
                        throw new Error('Unauthorized');
                    }

                    if (!!cardRes) {
                        return cardRes;
                    }
                } catch (error) {
                    saveErrorLog({
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        url: 'useCardTransactions:fetchCardsTransactions',
                        additionalData: { cardId: id, statusCode: axios.isAxiosError(error) ? error.response?.status : undefined }
                    });
                    if (axios.isAxiosError(error) && error.response?.status === 401) {
                        deleteHoldersToken(address);
                        throw new Error('Unauthorized');
                    } else {
                        throw error;
                    }
                }
            }
            return null;
        }
    });
}