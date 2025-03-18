import { SolanaNativeTransfer } from "../../api/solana/fetchSolanaTransactions";
import { SolanaTokenTransfer, SolanaTransaction } from "../../api/solana/fetchSolanaTransactions";
import { formatTime } from "../../../utils/dates";
import { SolanaTransfer } from "../../api/solana/fetchSolanaTransactions";
import { formatDate } from "../../../utils/dates";
import { fromNano, toNano } from "@ton/core";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { t } from "../../../i18n/t";
import { useSolanaToken } from "./useSolanaToken";

export type SolanaTransactionPreview = {
    op: string;
    amount: string;
    kind: 'in' | 'out';
    from: string;
    to: string;
    dateStr: string;
    decimals: number;
    symbol: string;
    mint?: string;
    comment?: string;
    address: string | undefined;
    type: 'token' | 'native';
}

export function useSolanaTransferInfo(params: { type: 'token' | 'native', transfer: SolanaTransfer, transaction: SolanaTransaction, owner: string }): SolanaTransactionPreview {
    const { type, transfer, transaction, owner } = params;
    const accountData = transaction.accountData;
    const dateStr = `${formatDate(transaction.timestamp, 'MMMM dd, yyyy')} • ${formatTime(transaction.timestamp)}`;
    const mint = (transfer as SolanaTokenTransfer)?.mint;
    const tokenInfo = useSolanaToken(owner, mint);
    const symbol = tokenInfo?.symbol;
    const decimals = tokenInfo?.decimals;

    if (type === 'token') {
        const tokenTransfer = transfer as SolanaTokenTransfer;
        const kind: 'in' | 'out' = tokenTransfer.fromUserAccount === owner ? 'out' : 'in';
        const op = kind === 'in' ? t('tx.received') : t('tx.sent');
        const toAccount = accountData?.find((acc) => acc.account === tokenTransfer.toTokenAccount);
        const toAddress = toAccount?.tokenBalanceChanges.find((change) => change.tokenAccount === tokenTransfer.toTokenAccount)?.userAccount;
        const address = kind === 'in' ? tokenTransfer.fromUserAccount : toAddress;
        const amount = fromBnWithDecimals(toNano(tokenTransfer.tokenAmount), 9);

        return {
            op,
            amount,
            kind,
            from: tokenTransfer.fromUserAccount,
            to: tokenTransfer.toTokenAccount,
            dateStr,
            decimals: decimals ?? 6,
            symbol: symbol ?? 'USDC',
            mint: tokenTransfer.mint,
            address,
            type: 'token'
        }
    }

    const nativeTransfer = transfer as SolanaNativeTransfer;
    const kind: 'in' | 'out' = nativeTransfer.fromUserAccount === owner ? 'out' : 'in';
    const op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const amount = fromNano(nativeTransfer.amount);
    const address = kind === 'in' ? nativeTransfer.fromUserAccount : nativeTransfer.toUserAccount;

    return {
        op,
        amount,
        kind,
        from: nativeTransfer.fromUserAccount,
        to: nativeTransfer.toUserAccount,
        dateStr,
        decimals: 9,
        symbol: 'SOL',
        address,
        type: 'native'
    }
}