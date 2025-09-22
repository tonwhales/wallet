import React, { memo } from 'react';
import { UnifiedSolanaTransaction, isPendingSolanaTransaction, isBlockchainSolanaTransaction } from '../../../engine/types/unifiedTransaction';
import { SolanaTransactionView } from './solana/SolanaTransactionView';
import { PendingSolanaTransactionView } from './PendingSolanaTransactionView';
import { ReceiveableSolanaAsset } from '../ReceiveFragment';

export const UnifiedSolanaTransactionView = memo((props: {
    item: UnifiedSolanaTransaction,
    owner: string,
    asset?: ReceiveableSolanaAsset
}) => {
    const { item, owner, asset } = props;

    if (isPendingSolanaTransaction(item)) {
        return (
            <PendingSolanaTransactionView
                transaction={item.data}
                address={owner}
                mint={asset?.mint}
                viewType="history"
            />
        );
    }

    if (isBlockchainSolanaTransaction(item)) {
        return (
            <SolanaTransactionView
                item={item.data}
                owner={owner}
                asset={asset}
            />
        );
    }

    return null;
});

UnifiedSolanaTransactionView.displayName = 'UnifiedSolanaTransactionView';
