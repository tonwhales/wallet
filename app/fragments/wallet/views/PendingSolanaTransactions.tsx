import { StyleProp, ViewStyle, Text, View } from "react-native";
import { PendingSolanaTransaction } from "../../../engine/state/pending";
import { useSolanaSelectedAccount, useTheme } from "../../../engine/hooks";
import { memo, useEffect, useMemo } from "react";
import { usePendingSolanaActions } from "../../../engine/hooks/transactions/usePendingSolanaActions";
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
        viewType?: 'history' | 'main',
        address: string
    }
) => {
    return (
        <View style={[
            {
                overflow: 'hidden',
                borderRadius: 20,
                marginHorizontal: 16,
            },
            style
        ]}>
            {txs.map((tx, i) => (
                <PendingSolanaTransactionView
                    key={`tx-${tx.id}-${viewType}`}
                    transaction={tx}
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
    listStyle,
    mint
}: {
    address?: string,
    viewType?: 'history' | 'main',
    filter?: (tx: PendingSolanaTransaction) => boolean,
    onChange?: (txs: PendingSolanaTransaction[]) => void,
    listStyle?: StyleProp<ViewStyle>,
    mint?: string
}) => {
    const selectedAddress = useSolanaSelectedAccount();
    const addr = address ?? selectedAddress ?? '';
    const { state: pending, remove } = usePendingSolanaActions(addr, mint);
    const theme = useTheme();

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