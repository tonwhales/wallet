import { Pressable, View, Text, Platform, StyleSheet } from "react-native";
import { fragment } from "../../fragment";
import { useHoldersAccounts, useTheme } from "../../engine/hooks";
import { useParams } from "../../utils/useParams";
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
import { HoldersAccountCard } from "../../components/products/HoldersAccountCard";

import IcCheck from "@assets/ic-check.svg";

export type TransactionsFilterFragmentParams = { address: string, type: 'type' | 'holders' };

export const TransactionsFilterFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { address, type } = useParams<TransactionsFilterFragmentParams>();
    const safeArea = useSafeAreaInsets();
    const holdersAccounts = useHoldersAccounts(address);
    const cards = holdersAccounts.data?.accounts?.map((a) => a.cards)?.flat() as HoldersCard[] || [];
    const [filter, setFilter] = useTransactionsFilter(address);

    const [txsType, setTxsType] = useState<TransactionType | undefined>(filter?.type || TransactionType.ANY);
    const [cardId, setCardId] = useState<string>();

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
        : [
            { type: 'holders-any' },
            ...cards.map((c) => ({ type: 'holders', data: c }))
        ] as ({ type: 'holders', data: HoldersCard } | { type: 'holders-any' })[];

    const renderItem = ({ item }: { item: { type: 'type', value?: TransactionType } | { type: 'holders', data?: HoldersCard } | { type: 'holders-any' } }) => {
        switch (item.type) {
            case 'type': {
                const value = (item as { type: 'type', value?: TransactionType }).value || TransactionType.ANY;
                const isSelected = txsType === value;
                let icon = <Image
                    source={require('@assets/ic-filter-wallet.png')}
                    style={{ width: 24, height: 24, tintColor: theme.iconPrimary }}
                />
                if (value === TransactionType.HOLDERS) {
                    icon = <Image
                        source={require('@assets/ic-filter-card.png')}
                        style={{ width: 24, height: 24, tintColor: theme.iconPrimary }}
                    />
                }
                if (value === TransactionType.ANY) {
                    icon = <Image
                        source={require('@assets/ic-filter-any.png')}
                        style={{ width: 24, height: 24, tintColor: theme.iconPrimary }}
                    />
                }

                const onPress = () => {
                    setTxsType(value);
                }

                return (
                    <Pressable
                        onPress={onPress}
                        style={[
                            styles.item,
                            { backgroundColor: theme.surfaceOnElevation }
                        ]}
                    >
                        <View style={[styles.icon, { backgroundColor: theme.divider }]}>
                            {icon}
                        </View>
                        <Text style={[{ color: theme.textPrimary, flexGrow: 1 }, Typography.semiBold17_24]}>
                            {t(`transactions.filter.${value}`)}
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
            case 'holders': {
                const value = (item as { type: 'holders', data: HoldersCard });
                const isSelected = cardId === (value?.data?.id || '');
                const onPress = () => {
                    setCardId(isSelected ? undefined : value?.data?.id);
                }

                return (
                    <Pressable
                        onPress={onPress}
                        style={[
                            styles.item,
                            { backgroundColor: theme.surfaceOnElevation }
                        ]}
                    >
                        {!!value?.data && <HoldersAccountCard card={value.data as GeneralHoldersCard} theme={theme} />}
                        <Text style={[{ color: theme.textPrimary, flexGrow: 1 }, Typography.semiBold17_24]}>
                            {`${t('products.holders.card.card')} • ${value?.data?.lastFourDigits}`}
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
            default: {
                const isSelected = !cardId;
                const onPress = () => {
                    setCardId(undefined);
                }

                return (
                    <Pressable
                        onPress={onPress}
                        style={[
                            styles.item,
                            { backgroundColor: theme.surfaceOnElevation }
                        ]}
                    >
                        <Image
                            source={require('@assets/ic-filter-card-any.png')}
                            style={{ width: 46, height: 30, tintColor: theme.iconPrimary }}
                        />
                        <Text style={[{ color: theme.textPrimary, flexGrow: 1 }, Typography.semiBold17_24]}>
                            {t('transactions.filter.any')}
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
        }
    }

    const onApply = () => {
        setFilter((prev) => ({
            ...prev,
            type: txsType,
            cardIds: !!cardId ? [cardId] : undefined
        }));
        navigation.goBack();
    };

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                title={t(`transactions.filter.${type}`)}
            />
            <View style={{ gap: 8, paddingHorizontal: 16, flexGrow: 1, marginTop: 16 }}>
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    contentContainerStyle={{ gap: 16 }}
                    style={{ flexBasis: 0 }}
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