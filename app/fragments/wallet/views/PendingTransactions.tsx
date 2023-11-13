import React from "react";
import { memo } from "react";
import { View, Text } from "react-native";
import { usePendingTransactions } from "../../../engine/hooks/transactions/usePendingTransactions";
import { PendingTransaction } from "../../../engine/state/pending";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { PendingTransactionAvatar } from "../../../components/PendingTransactionAvatar";
import { useNetwork } from "../../../engine/hooks/network/useNetwork";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { t } from "../../../i18n/t";
import { ValueComponent } from "../../../components/ValueComponent";
import { useJettonContent } from "../../../engine/hooks/jettons/useJettonContent";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useContact } from "../../../engine/hooks/contacts/useContact";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { Address } from "@ton/core";
import { PriceComponent } from "../../../components/PriceComponent";
import { DappsRequests } from "./DappsRequests";

const PendingTransactionView = memo(({ tx, first, last }: { tx: PendingTransaction, first?: boolean, last?: boolean }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const targetFriendly = tx.address?.toString({ testOnly: isTestnet });
    const jettonMaster = useJettonContent(tx.body?.type === 'token' ? tx.body?.master.toString({ testOnly: isTestnet }) : null);
    const contact = useContact(targetFriendly);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (targetFriendly && KnownWallets(isTestnet)[targetFriendly]) {
        known = KnownWallets(isTestnet)[targetFriendly];
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={{
                paddingHorizontal: 16, paddingVertical: 20, paddingBottom: tx.body?.type === 'comment' ? 0 : undefined
            }}
        >
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: theme.border
                }}>
                    <PendingTransactionAvatar
                        kind={'out'}
                        address={targetFriendly}
                        avatarId={targetFriendly ?? 'batch'}
                    />
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {t('tx.sending')}
                        </Text>
                    </View>
                    {known ? (
                        <Text
                            style={{ color: theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {known.name}
                        </Text>
                    ) : (
                        <Text
                            style={{ color: theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {targetFriendly ? <AddressComponent address={Address.parse(targetFriendly)} /> : t('tx.batch')}
                        </Text>
                    )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={{
                            color: theme.textPrimary,
                            fontWeight: '600',
                            lineHeight: 24,
                            fontSize: 17,
                            marginRight: 2,
                        }}
                        numberOfLines={1}
                    >
                        {'-'}
                        <ValueComponent
                            value={tx.amount > 0n ? tx.amount : -tx.amount}
                            decimals={jettonMaster ? jettonMaster.decimals : undefined}
                            precision={3}
                        />
                        {jettonMaster ? ' ' + jettonMaster.symbol : ' TON'}
                    </Text>
                    {tx.body?.type !== 'token' && (
                        <PriceComponent
                            amount={tx.amount > 0n ? tx.amount : -tx.amount}
                            prefix={'-'}
                            style={{
                                height: undefined,
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{
                                color: theme.textSecondary,
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20
                            }}
                        />
                    )}
                </View>
            </View>
            {tx.body?.type === 'comment' && (
                <View style={{
                    flexShrink: 1, alignSelf: 'flex-start',
                    backgroundColor: theme.border,
                    marginTop: 8,
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: 10, marginLeft: 46 + 10, height: 36
                }}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={{ color: theme.textPrimary, fontSize: 15, maxWidth: 400, lineHeight: 20 }}
                    >
                        {tx.body.comment}
                    </Text>
                </View>
            )}
        </Animated.View>
    )
});

export const PendingTransactions = memo(() => {
    const pending = usePendingTransactions();
    const theme = useTheme();
    return (
        <View>
            <DappsRequests />
            {pending.length > 0 && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutUp}
                    style={{
                        backgroundColor: theme.background,
                        justifyContent: 'flex-end',
                        paddingBottom: 2,
                        paddingTop: 12,
                        marginVertical: 8,
                        paddingHorizontal: 16
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        lineHeight: 24, color: theme.textPrimary
                    }}>
                        {t('wallet.pendingTransactions')}
                    </Text>
                </Animated.View>
            )}
            <View style={{
                overflow: 'hidden',
            }}>
                {pending.map((tx, i) => <PendingTransactionView key={tx.id} tx={tx} first={i === 0} last={i === pending.length - 1} />)}
            </View>
        </View>
    );
});