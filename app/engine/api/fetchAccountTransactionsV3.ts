import axios from "axios";
import { CommonTx, TransactionType } from "../types";
import { whalesConnectEndpoint } from "../clients";

export type TonCursor = {
    lt?: string;
    hash?: string;
}

export type SolanaCursor = {
    before?: string | null;
}

export type SolanaTokenCursor = {
    before?: string | null;
    mint?: string;
}

export type AccountTransactionsV3Cursor = {
    ton?: TonCursor,
    solana?: SolanaCursor,
    solanaToken?: SolanaTokenCursor
}

export type AccountTransactionsV3 = {
    data: CommonTx[],
    hasMore: boolean,
    cursor?: AccountTransactionsV3Cursor
}

export type GetHoldersTransactionsParams = {
    from?: string;
    to?: string;
    accountIds?: string[];
    cardIds?: string[];
};

export type AccountTransactionsParams = GetHoldersTransactionsParams & { type?: TransactionType };

export async function fetchAccountTransactionsV3(
    account: {
        tonAddress: string;
        solanaAddress: string;
        solanaATAaddress?: string; // solana asset token account address
    },
    cursor: {
        ton?: { lt?: string; hash?: string },
        solana?: { before?: string | null },
        solanaToken?: { before?: string | null, mint?: string },
    },
    isTestnet: boolean,
    limit?: number,
): Promise<AccountTransactionsV3> {
    const url = `${whalesConnectEndpoint}/transactions/v3`;
    const body = { account, network: isTestnet ? 'testnet' : 'mainnet', cursor, limit };
    const res = await axios.post(url, body);

    if (res.status === 200) {
        return res.data as AccountTransactionsV3;
    }

    throw new Error(`Invalid response status: ${res.status} for ${account.tonAddress}`);
}