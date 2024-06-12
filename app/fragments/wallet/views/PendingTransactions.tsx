import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { memo } from "react";
import { View, Text, Pressable, StyleProp, ViewStyle } from "react-native";
import { usePendingTransactions } from "../../../engine/hooks/transactions/usePendingTransactions";
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
import { useBounceableWalletFormat, useSelectedAccount, useWalletSettings } from "../../../engine/hooks";
import { ThemeType } from "../../../engine/state/theme";
import { Typography } from "../../../components/styles";
import { useAppConfig } from "../../../engine/hooks/useAppConfig";
import { useContractInfo } from "../../../engine/hooks/metadata/useContractInfo";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { useLastWatchedBlock } from "../../../engine/hooks/useLastWatchedBlock";
import { throttleDebounce } from "../../../utils/throttleDebounce";

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
    onRemove,
    viewType = 'main',
    bounceableFormat,
    txTimeout
}: {
    tx: PendingTransaction,
    first?: boolean,
    last?: boolean,
    single?: boolean,
    onRemove?: (id: string) => void,
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

    const [failed, setFailed] = useState(false);

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

    const status = tx.status === 'pending' ? t('tx.sending') : t('tx.sent');
    const amount = body?.type === 'token'
        ? body.amount
        : tx.amount > 0n
            ? tx.amount
            : -tx.amount;

    const throttledAction = useCallback(throttleDebounce(
        (action: () => void) => action(),
        15 * 1000,
        true
    ), []);

    useEffect(() => {
        // Remove transaction from pending list
        if (onRemove && tx.status === 'sent') {
            // on history tab remove immediately
            if (viewType === 'history') {
                onRemove(tx.id);
                return;
            }

            // on main tab remove after 15 seconds
            throttledAction(() => onRemove(tx.id));
        }
    }, [tx.status, onRemove]);

    useEffect(() => {
        // Check if transaction failed
        if (tx.status === 'pending') {
            const failed = checkIfTxFailed(tx, txTimeout, lastBlock);

            if (failed) {
                // set failed flag
                setFailed(true);

                if (onRemove) {
                    // remove after 15 seconds delay
                    throttledAction(() => onRemove(tx.id));
                }
            }
        }
    }, [lastBlock, tx.blockSeqno, tx.id, tx.status, onRemove]);

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
                onPress={() => navigation.navigate('PendingTransaction', { transaction: tx, failed })}
            >
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {(tx.status === 'pending' && !failed) ? (
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
                        <Avatar
                            address={targetFriendly}
                            verified
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
                    )}
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[{ color: failed ? theme.accentRed : theme.textPrimary, flexShrink: 1 }, Typography.semiBold17_24]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {failed ? t('tx.failed') : status}
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

export const PendingTransactionsView = memo((
    {
        theme,
        pending,
        removePending,
        style,
        viewType = 'main'
    }: {
        theme: ThemeType,
        pending: PendingTransaction[],
        removePending: (id: string) => void,
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
            {pending.map((tx, i) => (
                <PendingTransactionView
                    key={tx.id}
                    tx={tx}
                    first={i === 0}
                    last={i === pending.length - 1}
                    onRemove={() => removePending(tx.id)}
                    viewType={viewType}
                    bounceableFormat={bounceableFormat}
                    txTimeout={appConfig.txTimeout}
                />
            ))}
        </View>
    );
});
PendingTransactionsView.displayName = 'PendingTransactionsView';

export const PendingTransactions = memo(({ address, viewType = 'main' }: { address?: string, viewType?: 'history' | 'main' }) => {
    const account = useSelectedAccount();
    const network = useNetwork();
    const [pending, setPending] = usePendingTransactions(address ?? account?.addressString ?? '', network.isTestnet);
    const theme = useTheme();

    const removePending = useCallback((id: string) => {
        setPending((prev) => {
            return prev.filter((tx) => tx.id !== id);
        });
    }, [setPending]);

    if (pending.length <= 0) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 16 }}>
            {pending.length > 0 && (
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
            <PendingTransactionsView
                theme={theme}
                pending={pending}
                removePending={removePending}
                viewType={viewType}
            />
        </View>
    );
});
PendingTransactions.displayName = 'PendingTransactions';