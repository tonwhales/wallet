import { memo, useCallback, useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import { PendingSolanaTransaction } from "../../../engine/state/pending";
import { useNetwork, usePendingSolanaActions, useSolanaTransactionStatus, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Pressable } from "react-native";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { Avatar } from "../../../components/avatar/Avatar";
import { Typography } from "../../../components/styles";
import { formatTime } from "../../../utils/dates";
import { ValueComponent } from "../../../components/ValueComponent";
import { ItemDivider } from "../../../components/ItemDivider";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { SOLANA_TRANSACTION_PROCESSING_TIMEOUT } from "../../../engine/hooks/solana/useSolanaTransactionStatus";

export const PendingSolanaTransactionView = memo(({
    transaction,
    last,
    single,
    viewType = 'main',
    address
}: {
    transaction: PendingSolanaTransaction,
    last?: boolean,
    single?: boolean,
    viewType?: 'history' | 'main' | 'jetton-history',
    address: string
}) => {
    const { target, amount, token } = transaction.tx;
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const status = useSolanaTransactionStatus(address, transaction.id, isTestnet ? 'devnet' : 'mainnet');
    const { markAsTimedOut, remove } = usePendingSolanaActions(address, isTestnet);

    const statusText = useMemo(() => {
        if (status.data?.confirmationStatus === 'finalized') {
            return t('tx.sent');
        }
        if (transaction.status === 'timed-out') {
            return t('tx.timeout');
        } else if (transaction.status === 'sent') {
            return t('tx.sent');
        }
        return t('tx.sending');
    }, [transaction.status, status]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            markAsTimedOut(transaction.id);
        }, SOLANA_TRANSACTION_PROCESSING_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        if (status.data?.confirmationStatus === 'finalized') {
            remove([transaction.id]);
        }
    }, [status.data?.confirmationStatus]);

    const onOpen = useCallback(() => {
        navigation.navigatePendingSolanaTransaction(transaction);
    }, [transaction]);

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={{
                paddingHorizontal: viewType === 'main' ? 20 : undefined,
                paddingVertical: 20,
                maxHeight: 86
            }}
        >
            <Pressable
                style={{
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                onPress={onOpen}
            >
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {(transaction.status === 'pending') ? (
                        <PendingTransactionAvatar
                            kind={'out'}
                            address={target}
                            avatarId={target ?? 'batch'}
                            style={{ backgroundColor: theme.backgroundPrimary }}
                            knownWallets={{}}
                        />
                    ) : (
                        <Avatar
                            address={target}
                            verified={transaction.status === 'sent'}
                            size={46}
                            borderWidth={0}
                            id={target}
                            theme={theme}
                            knownWallets={{}}
                            backgroundColor={theme.backgroundPrimary}
                            hashColor
                            icProps={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                        />
                    )}
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[
                                { color: transaction.status === 'timed-out' ? theme.warning : theme.textPrimary, flexShrink: 1 },
                                Typography.semiBold17_24
                            ]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {statusText}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                        <SolanaWalletAddress
                            address={target}
                            elipsise={{ end: 4, start: 4 }}
                            disableContextMenu
                            textStyle={[{ color: theme.textSecondary, marginTop: 2 }, Typography.regular15_20]}
                        />
                        <Text
                            style={[
                                { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                                Typography.regular15_20
                            ]}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {` • ${formatTime(transaction.time)}`}
                        </Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                        numberOfLines={1}
                    >
                        {'-'}
                        <ValueComponent
                            value={amount}
                            decimals={token?.decimals}
                            suffix={token?.symbol ? ` ${token.symbol}` : ' SOL'}
                            precision={2}
                            centFontStyle={{ fontSize: 15 }}
                        />
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    )
});
PendingSolanaTransactionView.displayName = 'PendingSolanaTransactionView';