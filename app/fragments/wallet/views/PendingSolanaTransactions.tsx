import { StyleProp, ViewStyle, Text, View } from "react-native";
import { PendingSolanaTransaction } from "../../../engine/state/pending";
import { useNetwork, useSolanaSelectedAccount, useSolanaTransactions, useTheme } from "../../../engine/hooks";
import { memo, useEffect, useMemo } from "react";
import { SolanaTransaction } from "../../../engine/api/solana/fetchSolanaTransactions";
import { usePendingSolanaActions } from "../../../engine/hooks/transactions/usePendingSolanaActions";
import { SOLANA_TRANSACTION_PROCESSING_TIMEOUT } from "../../../engine/hooks/solana/useSolanaTransactionStatus";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { PendingSolanaTransactionView } from "./PendingSolanaTransactionView";

export const PendingSolanaTransactionsList = memo((
    {
        txs,
        style,
        viewType = 'main',
        address
    }: {
        txs: PendingSolanaTransaction[],
        style?: StyleProp<ViewStyle>,
        viewType?: 'history' | 'main' | 'jetton-history',
        address: string
    }
) => {
    const theme = useTheme();

    return (
        <View style={[{ overflow: 'hidden', borderRadius: 20 }, style]}>
            {txs.map((tx, i) => (
                <PendingSolanaTransactionView
                    key={`tx-${tx.id}-${viewType}`}
                    transaction={tx}
                    last={(i === txs.length - 1) || viewType === 'history'}
                    viewType={viewType}
                    address={address}
                />
            ))}
        </View>
    );
});
PendingSolanaTransactionsList.displayName = 'PendingSolanaTransactionsList';

export const PendingSolanaTransactions = memo(({
    address,
    viewType = 'main',
    filter,
    onChange,
    listStyle
}: {
    address?: string,
    viewType?: 'history' | 'main' | 'jetton-history',
    filter?: (tx: PendingSolanaTransaction) => boolean,
    onChange?: (txs: PendingSolanaTransaction[]) => void,
    listStyle?: StyleProp<ViewStyle>
}) => {
    const selectedAddress = useSolanaSelectedAccount();
    const { isTestnet } = useNetwork();
    const addr = address ?? selectedAddress ?? '';
    const { state: pending, remove } = usePendingSolanaActions(addr, isTestnet);
    const txs = useSolanaTransactions(addr).data;
    const lastTx = (txs as SolanaTransaction[])?.slice(-1)?.[0];
    const theme = useTheme();

    useEffect(() => {
        if (!!lastTx) {
            remove(pending.filter((tx) => {
                if (tx.id === lastTx.signature) {
                    return false;
                }
                return tx.time + SOLANA_TRANSACTION_PROCESSING_TIMEOUT < lastTx.timestamp;
            }).map((tx) => tx.id));
        }
    }, [lastTx, pending]);

    const pendingTxs = useMemo(() => {
        // Show only pending on history tab
        if (viewType !== 'main') {
            return pending
                .filter((tx) => tx.status !== 'sent' && tx.status !== 'timed-out')
                .filter(filter ?? (() => true));
        }

        return pending.filter(filter ?? (() => true));
    }, [pending]);

    useEffect(() => {
        // Remove transactions after 15 seconds of changing status
        setTimeout(() => {
            const toRemove = pending
                .filter((tx) => tx.status !== 'pending')
                .map((tx) => tx.id);

            remove(toRemove);
        }, 15 * 1000);

        return () => {
            onChange?.(pending);
        }
    }, [pending]);

    if (pendingTxs.length <= 0) {
        return null;
    }

    return (
        <View>
            {pendingTxs.length > 0 && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutUp}
                    style={{
                        justifyContent: 'flex-end',
                        paddingVertical: 16,
                        paddingHorizontal: 16
                    }}
                >
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                        {t('wallet.pendingTransactions')}
                    </Text>
                </Animated.View>
            )}
            <PendingSolanaTransactionsList
                txs={pendingTxs}
                viewType={viewType}
                style={listStyle}
                address={addr}
            />
        </View>
    );
});
PendingSolanaTransactions.displayName = 'PendingSolanaTransactions';