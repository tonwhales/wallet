import { memo, useCallback, useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import { PendingSolanaTransaction, PendingSolanaTransactionInstructions, PendingSolanaTransactionTx } from "../../../engine/state/pending";
import { useNetwork, useSolanaToken, useSolanaTransactionStatus, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Pressable } from "react-native";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { Avatar } from "../../../components/avatar/Avatar";
import { Typography } from "../../../components/styles";
import { formatTime } from "../../../utils/dates";
import { ValueComponent } from "../../../components/ValueComponent";
import { ForcedAvatar } from "../../../components/avatar/ForcedAvatar";
import { InstructionName } from "../../../utils/solana/parseInstructions";
import { ASSET_ITEM_HEIGHT, TRANSACTION_AVATAR_SIZE, TRANSACTION_PROCESSING_TIMEOUT } from "../../../utils/constants";
import { TransactionType } from "../../../engine/types";

const PendingInstructionsView = memo(({
    transaction,
    viewType = 'main',
    onOpen,
    statusText,
    verified,
}: {
    transaction: PendingSolanaTransactionInstructions,
    viewType?: 'history' | 'main',
    onOpen: () => void,
    statusText: string
    verified: boolean
}) => {
    const isHolders = transaction.instructions.some(instruction => instruction?.program === 'Holders');
    const theme = useTheme();

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={{
                paddingHorizontal: viewType === 'main' ? 20 : 16,
                paddingVertical: viewType === 'main' ? 20 : 8,
                marginVertical: viewType === 'history' ? 8 : undefined,
                borderRadius: viewType === 'history' ? 12 : undefined,
                maxHeight: ASSET_ITEM_HEIGHT,
                backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary,
            }}
        >
            <Pressable
                style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                onPress={onOpen}
            >
                <View style={{
                    width: TRANSACTION_AVATAR_SIZE, height: TRANSACTION_AVATAR_SIZE,
                    borderRadius: TRANSACTION_AVATAR_SIZE / 2,
                    borderWidth: 0, marginRight: 8,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {(transaction.status === 'pending' || transaction.status === 'sent') ? (
                        <PendingTransactionAvatar
                            address={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                            avatarId={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            knownWallets={{}}
                            forceAvatar={isHolders ? 'holders' : undefined}
                            verified={verified}
                        />
                    ) : (
                        <View>
                            {isHolders ? (
                                <ForcedAvatar type={'holders'} size={TRANSACTION_AVATAR_SIZE} hideVerifIcon />
                            ) : (
                                <Avatar
                                    address={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                                    verified={verified}
                                    size={TRANSACTION_AVATAR_SIZE}
                                    borderWidth={0}
                                    id={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                                    theme={theme}
                                    knownWallets={{}}
                                    backgroundColor={viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary}
                                    hashColor
                                    icProps={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                                />
                            )}
                        </View>
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
                        <Text
                            style={[
                                { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                                Typography.regular15_20
                            ]}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {`${formatTime(transaction.time)}`}
                        </Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    {transaction.instructions.map((i) => {
                        const op = i?.name as InstructionName;
                        return (
                            <Text
                                style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                                numberOfLines={1}
                            >
                                {t(`solana.instructions.${op}`)}
                            </Text>
                        )
                    })}
                </View>
            </Pressable>
        </Animated.View>
    );
});

const PendingTxView = memo((
    {
        transaction,
        viewType = 'main',
        address,
        onOpen,
        statusText,
        verified,
    }: {
        transaction: PendingSolanaTransactionTx,
        viewType?: 'history' | 'main',
        address: string,
        onOpen: () => void,
        statusText: string,
        verified: boolean
    }
) => {
    const { target, amount, token } = transaction.tx;
    const theme = useTheme();
    const tokenData = useSolanaToken(address, token?.mint);

    const symbol = token?.symbol ?? tokenData?.symbol ?? 'SOL';
    const decimals = token?.decimals ?? tokenData?.decimals ?? 9;

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={viewType === 'main' ? FadeOutUp : undefined}
            style={{
                paddingHorizontal: viewType === 'main' ? 20 : 16,
                paddingVertical: viewType === 'main' ? 20 : 8,
                marginVertical: viewType === 'history' ? 8 : undefined,
                borderRadius: viewType === 'history' ? 12 : undefined,
                maxHeight: ASSET_ITEM_HEIGHT,
                backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary,
            }}
        >
            <Pressable
                style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                onPress={onOpen}
            >
                <View style={{
                    width: TRANSACTION_AVATAR_SIZE, height: TRANSACTION_AVATAR_SIZE,
                    borderRadius: 24,
                    backgroundColor: theme.surfaceOnBg,
                    borderWidth: 0, marginRight: 8,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {(transaction.status === 'pending' && !verified) ? (
                        <PendingTransactionAvatar
                            address={target}
                            avatarId={target ?? ''}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            knownWallets={{}}
                        />
                    ) : (
                        <Avatar
                            address={target}
                            verified={verified}
                            size={TRANSACTION_AVATAR_SIZE}
                            borderWidth={0}
                            id={target}
                            theme={theme}
                            knownWallets={{}}
                            backgroundColor={viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary}
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
                        <Text
                            style={[
                                { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                                Typography.regular15_20
                            ]}
                        >
                            {target.slice(0, 4)}...{target.slice(-4)}
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
                            decimals={decimals}
                            suffix={` ${symbol}`}
                            precision={2}
                            centFontStyle={{ fontSize: 15 }}
                        />
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    )
});

export const PendingSolanaTransactionView = memo(({
    transaction,
    address,
    markAsTimedOut,
    mint,
    viewType = 'main'
}: {
    transaction: PendingSolanaTransaction,
    address: string,
    markAsTimedOut: (id: string, txType: TransactionType) => void
    mint?: string,
    viewType?: 'history' | 'main'
}) => {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const status = useSolanaTransactionStatus(address, transaction.id, isTestnet ? 'devnet' : 'mainnet');

    useEffect(() => {
        if (transaction.status !== 'pending') {
            return;
        }
        const timeout = setTimeout(async () => {
            markAsTimedOut(transaction.id, TransactionType.SOLANA);
        }, TRANSACTION_PROCESSING_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        }
    }, [markAsTimedOut, transaction.id, transaction.status]);
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

    const onOpen = useCallback(() => {
        navigation.navigatePendingSolanaTransaction({
            owner: address,
            transaction,
            statusText
        });
    }, [transaction, statusText]);


    const isVerified = useMemo(() => transaction.status === 'sent' || status.data?.confirmationStatus === 'finalized', [transaction.status, status.data?.confirmationStatus]);

    if (transaction.type === 'instructions') {
        return <PendingInstructionsView viewType={viewType} transaction={transaction} onOpen={onOpen} statusText={statusText} verified={isVerified} />;
    }
    return <PendingTxView viewType={viewType} transaction={transaction} address={address} onOpen={onOpen} statusText={statusText} verified={isVerified} />;
});
PendingSolanaTransactionView.displayName = 'PendingSolanaTransactionView';