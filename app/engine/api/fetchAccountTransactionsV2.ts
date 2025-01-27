import { Address } from "@ton/core";
import axios from "axios";
import { CommonTx, TransactionType } from "../types";
import { whalesConnectEndpoint } from "../clients";

export type TonCursor = {
    lt?: string;
    hash?: string;
}

export type HoldersCursor = {
    fromCursor?: string | null;
}

export type AccountTransactionsV2Cursor = {
    ton?: TonCursor,
    holders?: HoldersCursor
}

export type AccountTransactionsV2 = {
    data: CommonTx[],
    hasMore: boolean,
    cursor?: AccountTransactionsV2Cursor
}

export type GetHoldersTransactionsParams = {
    from?: string;
    to?: string;
    accountIds?: string[];
    cardIds?: string[];
};

export type AccountTransactionsParams = GetHoldersTransactionsParams & { type?: TransactionType };

export async function fetchAccountTransactionsV2(
    address: Address | string,
    isTestnet: boolean,
    cursor: {
        ton?: { lt?: string; hash?: string },
        holders?: { fromCursor?: string | null },
    },
    token?: string,
    params?:AccountTransactionsParams,
): Promise<AccountTransactionsV2> {
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const url = `${whalesConnectEndpoint}/transactions/v2/${addressString}`;
    const body = { cursor, token, params };
    const res = await axios.post(url, body);

    if (res.status === 200) {
        return res.data as AccountTransactionsV2;
    }

    throw new Error(`Invalid response status: ${res.status} for ${addressString}`);
}