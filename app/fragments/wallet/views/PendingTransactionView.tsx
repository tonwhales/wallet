import { memo, useCallback, useMemo } from "react";
import { PendingTransaction } from "../../../engine/state/pending";
import { useContact, useContractInfo, useNetwork, useTheme, useWalletSettings } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { KnownWallet, useKnownWallets } from "../../../secure/KnownWallets";
import { ForcedAvatar, ForcedAvatarType } from "../../../components/avatar/ForcedAvatar";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { t } from "../../../i18n/t";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Pressable } from "react-native";
import { PendingTransactionAvatar } from "../../../components/avatar/PendingTransactionAvatar";
import { Avatar, avatarColors } from "../../../components/avatar/Avatar";
import { Typography } from "../../../components/styles";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { Address } from "@ton/core";
import { formatTime } from "../../../utils/dates";
import { ValueComponent } from "../../../components/ValueComponent";
import { PriceComponent } from "../../../components/PriceComponent";
import { ItemDivider } from "../../../components/ItemDivider";
import { View, Text } from "react-native";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { useExtraCurrencyMap } from "../../../engine/hooks/jettons/useExtraCurrencyMap";
import { avatarHash } from "../../../utils/avatarHash";

export const PendingTransactionView = memo(({
    tx,
    first,
    last,
    single,
    viewType = 'main',
    bounceableFormat,
    txTimeout,
    owner
}: {
    tx: PendingTransaction,
    first?: boolean,
    last?: boolean,
    single?: boolean,
    viewType?: 'history' | 'main' | 'jetton-history',
    bounceableFormat?: boolean,
    txTimeout: number,
    owner: string
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const body = tx.body;
    const knownWallets = useKnownWallets(isTestnet);
    const bounceable = bounceableFormat ? true : (body?.type === 'token' ? body.bounceable : tx.bounceable);
    const targetFriendly = body?.type === 'token'
        ? body.target.toString({ testOnly: isTestnet })
        : tx.address?.toString({ testOnly: isTestnet });
    const targetFriendlyBounceable = body?.type === 'token'
        ? body.target.toString({ testOnly: isTestnet, bounceable: body.bounceable })
        : tx.address?.toString({ testOnly: isTestnet, bounceable: tx.bounceable });

    const contact = useContact(targetFriendlyBounceable);
    const [settings] = useWalletSettings(targetFriendlyBounceable);
    const targetContract = useContractInfo(tx.address?.toString({ testOnly: isTestnet }) ?? null);
    const ledgerContext = useLedgerTransport();
    const ledgerAddresses = ledgerContext?.wallets;
    const extraCurrencyMap = useExtraCurrencyMap((tx.body as any)?.extraCurrency, owner);

    const forceAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (targetContract?.kind === 'dedust-vault') {
            return 'dedust';
        }
        if (
            (targetContract?.kind === 'jetton-card' && tx.body?.type === 'token')
            || targetContract?.kind === 'card'
        ) {
            return 'holders';
        }

        if (tx.body?.type === 'payload') {
            const body = parseMessageBody(tx.body.cell);
            if (!!body && (
                body.type === 'holders::account::top_up'
                || body.type === 'holders::account::limits_change'
            )) {
                return 'holders';
            }
        }
    }, [tx.address, tx.body, targetContract?.kind, ledgerAddresses]);

    const isLedgerTarget = useMemo(() => {
        return !!ledgerAddresses?.find((addr) => {
            try {
                return tx.address?.equals(Address.parse(addr.address));
            } catch (error) {
                return false;
            }
        });
    }, [ledgerAddresses, tx.address]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (targetFriendlyBounceable) {
        if (knownWallets[targetFriendlyBounceable]) {
            known = knownWallets[targetFriendlyBounceable];
        }
        if (!!contact) { // Resolve contact known wallet
            known = { name: contact.name }
        }
        if (!!settings?.name) {
            known = { name: settings.name }
        }
    }

    const avatarColorHash = settings?.color ?? avatarHash(targetFriendly ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

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

    const onOpen = useCallback(() => {
        navigation.navigatePendingTx({
            transaction: tx,
            timedOut: tx.status === 'timed-out',
            forceAvatar,
            isLedgerTarget
        });
    }, [forceAvatar]);

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
                    {(tx.status === 'pending') ? (
                        <PendingTransactionAvatar
                            kind={'out'}
                            address={targetFriendly}
                            avatarId={targetFriendly ?? 'batch'}
                            style={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                            knownWallets={knownWallets}
                            forceAvatar={forceAvatar}
                            isLedger={isLedgerTarget}
                        />
                    ) : (
                        forceAvatar ? (
                            <ForcedAvatar type={forceAvatar} size={46} />
                        ) : (
                            <Avatar
                                address={targetFriendly}
                                verified={tx.status === 'sent'}
                                size={46}
                                borderWidth={0}
                                hash={settings?.avatar}
                                id={targetFriendly ?? 'batch'}
                                theme={theme}
                                knownWallets={knownWallets}
                                backgroundColor={avatarColor ?? theme.backgroundPrimary}
                                icProps={{ backgroundColor: viewType === 'main' ? theme.surfaceOnBg : theme.backgroundPrimary }}
                                isLedger={isLedgerTarget}
                            />
                        )
                    )}
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[
                                { color: tx.status === 'timed-out' ? theme.warning : theme.textPrimary, flexShrink: 1 },
                                Typography.semiBold17_24
                            ]}
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
                    {amount >= 0n && (
                        <Text
                            style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                            numberOfLines={1}
                        >
                            {'-'}
                            <ValueComponent
                                value={amount}
                                decimals={(body?.type === 'token' && body.jetton.decimals) ? body.jetton.decimals : undefined}
                                precision={4}
                            />
                            {(body?.type === 'token' && !!body.jetton?.symbol) ? ` ${body.jetton.symbol}` : ' TON'}
                        </Text>
                    )}
                    {!!extraCurrencyMap && Object.entries(extraCurrencyMap).map(([id, extraCurrency]) => (
                        <Text
                            key={`extra-currency-${id}`}
                            style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                            numberOfLines={1}
                        >
                            {'-'}
                            <ValueComponent
                                value={extraCurrency.amount}
                                decimals={extraCurrency.preview.decimals}
                                precision={3}
                            />
                            {` ${extraCurrency.preview.symbol}`}
                        </Text>
                    ))}
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