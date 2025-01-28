import { Pressable, View, Text, Platform, StyleSheet } from "react-native";
import { fragment } from "../../fragment";
import { useHoldersAccounts, useNetwork, useTheme } from "../../engine/hooks";
import { useParams } from "../../utils/useParams";
import { AccountTransactionsParams } from "../../engine/api/fetchAccountTransactionsV2";
import { TransactionType } from "../../engine/types";
import { useState } from "react";
import { ScreenHeader } from "../../components/ScreenHeader";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTransactionsFilter } from "../../engine/hooks/transactions/useTransactionsFilter";
import { FlatList } from "react-native-gesture-handler";
import { GeneralHoldersCard, HoldersCard } from "../../engine/api/holders/fetchAccounts";
import { Image } from "expo-image";
import { Typography } from "../../components/styles";
import { t } from "../../i18n/t";

import IcCheck from "@assets/ic-check.svg";
import { HoldersAccountCard } from "../../components/products/HoldersAccountCard";

export type TransactionsFilterFragmentParams = { address: string, type: 'type' | 'holders' };

export const TransactionsFilterFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { address, type } = useParams<TransactionsFilterFragmentParams>();
    const safeArea = useSafeAreaInsets();
    const holdersAccounts = useHoldersAccounts(address);
    const cards = holdersAccounts.data?.accounts?.map((a) => a.cards)?.flat() as HoldersCard[] || [];
    const [filter, setFilter] = useTransactionsFilter(address);

    const [txsType, setTxsType] = useState<TransactionType>(filter?.type || TransactionType.ANY);
    const [cardIds, setCardIds] = useState<string[]>(filter?.cardIds || []);

    const allCardsSelected = cardIds.length === cards.length;

    const data = (type === 'type')
        ? [
            {
                type: 'type',
                value: TransactionType.ANY,
            },
            {
                type: 'type',
                value: TransactionType.TON,
            },
            {
                type: 'type',
                value: TransactionType.HOLDERS,
            },
        ] as { type: 'type', value: TransactionType }[]
        : [...cards.map((c) => ({ type: 'holders', data: c }))] as { type: 'holders', data: HoldersCard }[];

    const renderItem = ({ item }: { item: { type: 'type' | 'holders', value?: TransactionType, data?: HoldersCard } }) => {
        if (item.type === 'type') {
            const isSelected = txsType === item.value;
            let icon = <Image
                source={require('@assets/ic-coins.png')}
                style={{ width: 46, height: 46, borderRadius: 23 }}
            />
            if (item.value === TransactionType.HOLDERS) {
                icon = <Image
                    source={require('@assets/ic-holders-accounts.png')}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                />
            }
            if (item.value === TransactionType.ANY) {
                icon = <Image
                    source={require('@assets/ic-filter-any.png')}
                    style={{ width: 24, height: 24 }}
                />
            }

            return (
                <Pressable
                    onPress={() => setTxsType(item.value)}
                    style={[
                        styles.item,
                        { backgroundColor: theme.surfaceOnElevation }
                    ]}
                >
                    <View style={[styles.icon, { backgroundColor: theme.divider }]}>
                        {icon}
                    </View>
                    <Text style={[{ color: theme.textPrimary, flexGrow: 1 }, Typography.semiBold17_24]}>
                        {t(`transactions.filter.${item.value}`)}
                    </Text>
                    <View style={{
                        height: 24, width: 24,
                        borderRadius: 12,
                        backgroundColor: isSelected ? theme.accent : theme.divider,
                        justifyContent: 'center', alignItems: 'center',
                        overflow: 'hidden'
                    }}>
                        {isSelected && (
                            <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                        )}
                    </View>
                </Pressable>
            );
        }

        const isSelected = cardIds.includes(item.data?.id || '');

        return (
            <Pressable
                onPress={() => {
                    if (isSelected) {
                        setCardIds(cardIds.filter((id) => id !== item.data?.id));
                    } else {
                        setCardIds([...cardIds, item.data?.id || '']);
                    }
                }}
                style={[
                    styles.item,
                    { backgroundColor: theme.surfaceOnElevation }
                ]}
            >
                {item.data && <HoldersAccountCard card={item.data as GeneralHoldersCard} theme={theme} />}
                <Text style={[{ color: theme.textPrimary, flexGrow: 1 }, Typography.semiBold17_24]}>
                    {`${t('products.holders.card.card')} • ${item.data?.lastFourDigits}`}
                </Text>
                <View style={{
                    height: 24, width: 24,
                    borderRadius: 12,
                    backgroundColor: isSelected ? theme.accent : theme.divider,
                    justifyContent: 'center', alignItems: 'center',
                    overflow: 'hidden'
                }}>
                    {isSelected && (
                        <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                    )}
                </View>
            </Pressable>
        );
    }

    const onApply = () => {
        setFilter((prev) => ({
            ...prev,
            type: txsType,
            cardIds: cardIds.length === cards.length ? undefined : cardIds
        }));
        navigation.goBack();
    };

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader style={{ paddingHorizontal: 16 }} onBackPressed={navigation.goBack} title={'Filter transactions'} />
            <View style={{ gap: 8, paddingHorizontal: 16, flexGrow: 1, marginTop: 16 }}>
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    contentContainerStyle={{ gap: 16 }}
                />
                <View style={[
                    { marginTop: 16, justifyContent: 'flex-end' },
                    Platform.select({
                        android: { marginBottom: safeArea.bottom + 16 },
                        ios: { marginBottom: safeArea.bottom + 32 }
                    })
                ]}>
                    <RoundButton
                        onPress={onApply}
                        title={'Apply'}
                    />
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        padding: 20, borderRadius: 16,
        alignItems: 'center', gap: 12
    },
    icon: {
        height: 46, width: 46,
        borderRadius: 24,
        justifyContent: 'center', alignItems: 'center'
    }
});