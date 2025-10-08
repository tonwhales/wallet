/**
 * Filters only blockchain transactions that were BEFORE the earliest pending
 */
export function filterTransactionsBeforeEarliestPending<
    TBlockchain extends { time: number },
    TPending extends { time: number }
>(
    blockchainTxs: TBlockchain[],
    pendingTxs: TPending[]
): TBlockchain[] {
    if (pendingTxs.length === 0) {
        return blockchainTxs;
    }

    const earliestPendingTime = Math.min(...pendingTxs.map(tx => tx.time));
    
    return blockchainTxs.filter(blockchainTx => {
        return blockchainTx.time < earliestPendingTime;
    });
}
