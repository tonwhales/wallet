import { memo, useCallback, useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import { PendingSolanaTransaction, PendingSolanaTransactionInstructions, PendingSolanaTransactionTx } from "../../../engine/state/pending";
import { useNetwork, usePendingSolanaActions, useSolanaToken, useSolanaTransactionStatus, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Pressable } from "react-native";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { Avatar } from "../../../components/avatar/Avatar";
import { Typography } from "../../../components/styles";
import { formatTime } from "../../../utils/dates";
import { ValueComponent } from "../../../components/ValueComponent";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { SOLANA_TRANSACTION_PROCESSING_TIMEOUT } from "../../../engine/hooks/solana/useSolanaTransactionStatus";
import { ForcedAvatar } from "../../../components/avatar/ForcedAvatar";
import { InstructionName } from "../../../utils/solana/parseInstructions";
import { ASSET_ITEM_HEIGHT } from "../../../utils/constants";

const PendingInstructionsView = memo(({
    transaction,
    last,
    single,
    viewType = 'main',
    address,
    onOpen,
    statusText
}: {
    transaction: PendingSolanaTransactionInstructions,
    last?: boolean,
    single?: boolean,
    viewType?: 'history' | 'main',
    address: string,
    onOpen: () => void,
    statusText: string
}) => {
    const isHolders = transaction.instructions.some(instruction => instruction?.program === 'Holders');
    const theme = useTheme();

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={{
                paddingHorizontal: viewType === 'main' ? 20 : undefined,
                paddingVertical: 20,
                maxHeight: ASSET_ITEM_HEIGHT,
                backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary,
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
                            address={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                            avatarId={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            knownWallets={{}}
                            forceAvatar={isHolders ? 'holders' : undefined}
                        />
                    ) : (
                        <View>
                            {isHolders ? (
                                <ForcedAvatar type={'holders'} size={46} hideVerifIcon />
                            ) : (
                                <Avatar
                                    address={transaction.instructions[0]?.accounts?.[0]?.pubkey.toString() ?? ''}
                                    verified={transaction.status === 'sent'}
                                    size={46}
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
        last,
        single,
        viewType = 'main',
        address,
        onOpen,
        statusText
    }: {
        transaction: PendingSolanaTransactionTx,
        last?: boolean,
        single?: boolean,
        viewType?: 'history' | 'main',
        address: string,
        onOpen: () => void,
        statusText: string
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
            exiting={FadeOutUp}
            style={{
                paddingHorizontal: viewType === 'main' ? 20 : undefined,
                paddingVertical: 20,
                maxHeight: ASSET_ITEM_HEIGHT,
                backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary,
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
                            avatarId={target ?? ''}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
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
    mint,
    viewType = 'main'
}: {
    transaction: PendingSolanaTransaction,
    address: string,
    mint?: string,
    viewType?: 'history' | 'main'
}) => {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const status = useSolanaTransactionStatus(address, transaction.id, isTestnet ? 'devnet' : 'mainnet');
    const { markAsTimedOut, remove, txsQuery } = usePendingSolanaActions(address, mint);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            await txsQuery.refresh();
            markAsTimedOut(transaction.id);
        }, SOLANA_TRANSACTION_PROCESSING_TIMEOUT);

        return () => {
            clearTimeout(timeout);
        }
    }, [address, isTestnet]);

    useEffect(() => {
        if (status.data?.confirmationStatus === 'finalized') {
            remove([transaction.id]);
        }
    }, [status.data?.confirmationStatus]);

    const onOpen = useCallback(() => {
        navigation.navigatePendingSolanaTransaction({
            owner: address,
            transaction
        });
    }, [transaction]);

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

    if (transaction.type === 'instructions') {
        return <PendingInstructionsView viewType={viewType} transaction={transaction} address={address} onOpen={onOpen} statusText={statusText}  />;
    }
    return <PendingTxView viewType={viewType} transaction={transaction} address={address} onOpen={onOpen} statusText={statusText} />;
});
PendingSolanaTransactionView.displayName = 'PendingSolanaTransactionView';