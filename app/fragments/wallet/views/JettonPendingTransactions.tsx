import React, { useEffect, useMemo } from "react";
import { memo } from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { PendingTransaction } from "../../../engine/state/pending";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { useNetwork } from "../../../engine/hooks/network/useNetwork";
import { t } from "../../../i18n/t";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { usePendingActions, useSelectedAccount } from "../../../engine/hooks";
import { Typography } from "../../../components/styles";
import { PendingTransactionsList } from "./PendingTransactions";
import { useJettonTransactions } from "../../../engine/hooks/transactions/useJettonTransactions";

const txTimeout = 5 * 1000;

export const JettonPendingTransactions = memo(({
    owner,
    master,
    filter,
    onChange,
    listStyle
}: {
    owner: string,
    master: string,
    filter?: (tx: PendingTransaction) => boolean,
    onChange?: (txs: PendingTransaction[]) => void,
    listStyle?: StyleProp<ViewStyle>
}) => {
    const theme = useTheme();
    const account = useSelectedAccount();
    const network = useNetwork();
    const addr = owner ?? account?.addressString ?? '';
    const { state: pending, removePending } = usePendingActions(addr, network.isTestnet);
    const txs = useJettonTransactions(owner, master).data;
    const last32Txs = txs?.flat()?.slice(-32);

    useEffect(() => {
        if (!last32Txs) {
            return;
        }
        try {
            removePending(pending.filter(tx => {
                return last32Txs.some((t) => {
                    const lastTxtime = Number(t.transaction_now);
                    return (lastTxtime - tx.time) >= txTimeout;
                });
            }).map(tx => tx.id));
        } catch { }
    }, [last32Txs, pending]);

    const pendingTxs = useMemo(() => {
        // Show only pending on history tab
        return pending
            .filter((tx) => tx.status !== 'sent' && tx.status !== 'timed-out')
            .filter(filter ?? (() => true));
    }, [pending]);

    useEffect(() => {
        // Remove transactions after 15 seconds of changing status
        setTimeout(() => {
            const toRemove = pending
                .filter((tx) => tx.status !== 'pending')
                .map((tx) => tx.id);

            removePending(toRemove);
        }, 15 * 1000);

        return () => {
            onChange?.(pending);
        }
    }, [pending]);

    if (pendingTxs.length <= 0) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 16 }}>
            {pendingTxs.length > 0 && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutUp}
                    style={{
                        backgroundColor: theme.backgroundPrimary,
                        justifyContent: 'flex-end',
                        paddingVertical: 16,
                        marginTop: 20,
                    }}
                >
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                        {t('wallet.pendingTransactions')}
                    </Text>
                </Animated.View>
            )}
            <PendingTransactionsList
                theme={theme}
                txs={pendingTxs}
                viewType={'jetton-history'}
                style={listStyle}
                owner={owner}
            />
        </View>
    );
});
JettonPendingTransactions.displayName = 'JettonPendingTransactions';