import { formatTime } from "../../../utils/dates";
import { formatDate } from "../../../utils/dates";
import { fromNano } from "@ton/core";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { t } from "../../../i18n/t";
import { useSolanaToken } from "./useSolanaToken";
import { PendingSolanaTransactionPreviewParams } from "../../../fragments/solana/transaction/PendingSolanaTransactionPreviewFragment";
import { SolanaTransactionPreview } from "./useSolanaTransferInfo";

export function usePendingSolanaTransferInfo(params: PendingSolanaTransactionPreviewParams): SolanaTransactionPreview | null {
    const { transaction, owner } = params;
    const dateStr = `${formatDate(transaction.time, 'MMMM dd, yyyy')} • ${formatTime(transaction.time)}`;
    const mint = transaction.type === 'tx' ? (transaction.tx.token?.mint ?? undefined) : undefined;
    const tokenInfo = useSolanaToken(owner, mint);
    const symbol = tokenInfo?.symbol ?? 'SOL';
    const decimals = tokenInfo?.decimals ?? 9;

    const op = t('tx.sending');
    let kind = 'out';
    if (transaction.type === 'tx') {
        const address = transaction.tx.target;
        const amount = transaction.tx.token
            ? fromBnWithDecimals(transaction.tx.amount, decimals)
            : fromNano(transaction.tx.amount);

        return {
            op,
            amount,
            kind: kind as 'out',
            from: owner,
            to: address,
            dateStr,
            decimals,
            symbol,
            mint: transaction.tx.token?.mint,
            address,
            type: transaction.tx.token ? 'token' : 'native'
        }
    }

    return null;
}