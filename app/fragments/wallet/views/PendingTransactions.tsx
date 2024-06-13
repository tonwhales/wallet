import React, { useEffect, useMemo } from "react";
import { memo } from "react";
import { View, Text, Pressable, StyleProp, ViewStyle, Image } from "react-native";
import { PendingTransaction } from "../../../engine/state/pending";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { useNetwork } from "../../../engine/hooks/network/useNetwork";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { t } from "../../../i18n/t";
import { ValueComponent } from "../../../components/ValueComponent";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useContact } from "../../../engine/hooks/contacts/useContact";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { Address } from "@ton/core";
import { PriceComponent } from "../../../components/PriceComponent";
import { ItemDivider } from "../../../components/ItemDivider";
import { formatTime } from "../../../utils/dates";
import { Avatar } from "../../../components/avatar/Avatar";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useBounceableWalletFormat, usePendingActions, useSelectedAccount, useWalletSettings } from "../../../engine/hooks";
import { ThemeType } from "../../../engine/state/theme";
import { Typography } from "../../../components/styles";
import { useAppConfig } from "../../../engine/hooks/useAppConfig";
import { useContractInfo } from "../../../engine/hooks/metadata/useContractInfo";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { useLastWatchedBlock } from "../../../engine/hooks/useLastWatchedBlock";

function checkIfTxFailed(tx: PendingTransaction, txTimeout: number = 60, lastWatchedBlock: { seqno: number, lastUtime: number } | null) {
    const currentBlock = lastWatchedBlock?.seqno ?? 0;
    const blockToCheck = tx.blockSeqno + 20;

    if (tx.blockSeqno === currentBlock || blockToCheck >= currentBlock) {
        return false;
    }

    let blockCreatedAt = lastWatchedBlock?.lastUtime ?? 0;

    // check if block was created after transaction expiration date
    return blockCreatedAt > (tx.time + txTimeout);
}

const PendingTransactionView = memo(({
    tx,
    first,
    last,
    single,
    timeOut,
    viewType = 'main',
    bounceableFormat,
    txTimeout
}: {
    tx: PendingTransaction,
    first?: boolean,
    last?: boolean,
    single?: boolean,
    timeOut?: (id: string) => void,
    viewType?: 'history' | 'main',
    bounceableFormat?: boolean,
    txTimeout: number
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const lastBlock = useLastWatchedBlock();
    const navigation = useTypedNavigation();
    const body = tx.body;
    const targetFriendly = body?.type === 'token'
        ? body.target.toString({ testOnly: isTestnet })
        : tx.address?.toString({ testOnly: isTestnet });
    const contact = useContact(targetFriendly);
    const [settings,] = useWalletSettings(targetFriendly);
    const knownWallets = KnownWallets(isTestnet);
    const bounceable = bounceableFormat ? true : (body?.type === 'token' ? body.bounceable : tx.bounceable);
    const targetContract = useContractInfo(tx.address?.toString({ testOnly: isTestnet }) ?? null);

    const isHoldersOp = useMemo(() => {
        if (targetContract?.kind === 'jetton-card' && tx.body?.type === 'token') {
            return true;
        }

        if (tx.body?.type === 'payload') {
            const body = parseMessageBody(tx.body.cell);
            if (!!body && (
                body.type === 'holders::account::top_up'
                || body.type === 'holders::account::limits_change'
            )) {
                return true;
            }
        }

    }, [tx, targetContract?.kind]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (targetFriendly) {
        if (knownWallets[targetFriendly]) {
            known = knownWallets[targetFriendly];
        }
        if (!!contact) { // Resolve contact known wallet
            known = { name: contact.name }
        }
    }

    const status = useMemo(() => {
        if (tx.status === 'timed-out') {
            return t('tx.timeout');
        } else if (tx.status === 'sent') {
            return t('tx.sent');
        }
        return t('tx.sending');
    }, [tx.status]);

    const amount = body?.type === 'token'
        ? body.amount
        : tx.amount > 0n
            ? tx.amount
            : -tx.amount;

    // check if transaction timed out after 20 blocks and tx timeout
    useEffect(() => {
        if (tx.status === 'pending') {
            const failed = checkIfTxFailed(tx, txTimeout, lastBlock);

            // mark as timed out
            if (failed) {
                timeOut?.(tx.id);
            }
        }
    }, [lastBlock, timeOut]);

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
                onPress={() => navigation.navigate('PendingTransaction', { transaction: tx, timedOut: tx.status === 'timed-out' })}
            >
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {(tx.status === 'pending') ? (
                        <PendingTransactionAvatar
                            kind={'out'}
                            address={targetFriendly}
                            avatarId={targetFriendly ?? 'batch'}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            knownWallets={knownWallets}
                            theme={theme}
                            holders={isHoldersOp}
                        />
                    ) : (
                        isHoldersOp ? (
                            <Image
                                source={require('@assets/ic-holders-accounts.png')}
                                style={{ width: 46, height: 46, borderRadius: 23 }}
                            />
                        ) : (
                            <Avatar
                                address={targetFriendly}
                                verified={tx.status === 'sent'}
                                size={46}
                                borderWith={0}
                                hash={settings?.avatar}
                                id={targetFriendly ?? 'batch'}
                                theme={theme}
                                knownWallets={knownWallets}
                                backgroundColor={theme.backgroundPrimary}
                                hashColor
                                icProps={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            />
                        )
                    )}
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[{ color: tx.status === 'timed-out' ? theme.warning : theme.textPrimary, flexShrink: 1 }, Typography.semiBold17_24]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {status}
                        </Text>
                    </View>
                    {known ? (
                        <Text
                            style={[
                                { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                                Typography.regular15_20
                            ]}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {known.name}
                        </Text>
                    ) : (
                        <Text
                            style={[
                                { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                                Typography.regular15_20
                            ]}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {targetFriendly
                                ? <AddressComponent
                                    bounceable={bounceable}
                                    address={Address.parse(targetFriendly)}
                                    testOnly={isTestnet}
                                    known={!!known}
                                />
                                : t('tx.batch')
                            }
                            {` • ${formatTime(tx.time)}`}
                        </Text>
                    )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                        numberOfLines={1}
                    >
                        {'-'}
                        <ValueComponent
                            value={amount}
                            decimals={(body?.type === 'token' && body.jetton.decimals) ? body.jetton.decimals : undefined}
                            precision={3}
                        />
                        {body?.type === 'token' && body.jetton.symbol ? ` ${body.jetton.symbol}` : ' TON'}
                    </Text>
                    {tx.body?.type !== 'token' && (
                        <PriceComponent
                            amount={amount}
                            prefix={'-'}
                            style={{
                                height: undefined,
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                            }}
                            theme={theme}
                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        />
                    )}
                </View>
            </Pressable>
            {!last && !single && (
                <ItemDivider />
            )}
        </Animated.View>
    )
});
PendingTransactionView.displayName = 'PendingTransactionView';

export const PendingTransactionsList = memo((
    {
        theme,
        txs,
        timeOut,
        style,
        viewType = 'main'
    }: {
        theme: ThemeType,
        txs: PendingTransaction[],
        timeOut?: (id: string) => void,
        style?: StyleProp<ViewStyle>,
        viewType?: 'history' | 'main'
    }
) => {
    const [bounceableFormat,] = useBounceableWalletFormat();
    const appConfig = useAppConfig();

    return (
        <View style={[
            {
                overflow: 'hidden',
                backgroundColor: viewType === 'main' ? theme.surfaceOnBg : undefined,
                borderRadius: 20,
            },
            style
        ]}>
            {txs.map((tx, i) => (
                <PendingTransactionView
                    key={tx.id}
                    tx={tx}
                    first={i === 0}
                    last={i === txs.length - 1}
                    timeOut={timeOut}
                    viewType={viewType}
                    bounceableFormat={bounceableFormat}
                    txTimeout={appConfig.txTimeout}
                />
            ))}
        </View>
    );
});
PendingTransactionsList.displayName = 'PendingTransactionsView';

export const PendingTransactions = memo(({ address, viewType = 'main' }: { address?: string, viewType?: 'history' | 'main' }) => {
    const account = useSelectedAccount();
    const network = useNetwork();
    const { state: pending, removePending, markAsTimedOut } = usePendingActions(address ?? account?.addressString ?? '', network.isTestnet);
    const theme = useTheme();

    const txs = useMemo(() => {
        // Show only pending on history tab
        if (viewType === 'history') {
            return pending.filter((tx) => tx.status !== 'sent' && tx.status !== 'timed-out');
        }

        return pending;
    }, [pending]);

    useEffect(() => {
        // Remove transactions after 15 seconds of changing status
        setTimeout(() => {
            const toRemove = pending
                .filter((tx) => tx.status !== 'pending')
                .map((tx) => tx.id);

            removePending(toRemove);
        }, 15 * 1000);
    }, [pending]);

    if (txs.length <= 0) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 16 }}>
            {txs.length > 0 && (
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
                txs={txs}
                timeOut={markAsTimedOut}
                viewType={viewType}
            />
        </View>
    );
});
PendingTransactions.displayName = 'PendingTransactions';