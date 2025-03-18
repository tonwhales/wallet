import { Address } from "@ton/core";
import { memo } from "react";
import { PendingTransactions } from "./PendingTransactions";
import { useHoldersAccounts, useNetwork, useTheme } from "../../../engine/hooks";
import { View, StyleSheet, Text, Pressable, ScrollView } from "react-native";
import { useTransactionsFilter } from "../../../engine/hooks/transactions/useTransactionsFilter";
import { TransactionType } from "../../../engine/types";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { Image } from "expo-image";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { HoldersCard } from "../../../engine/api/holders/fetchAccounts";

type TransactionsHeaderProps = {
    showFilters: boolean,
    address: string | Address
}

const HoldersChip = ({ address }: { address: string | Address }) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const [filters, setFilter] = useTransactionsFilter(addressString);
    const holdersAccounts = useHoldersAccounts(addressString);
    const cards = holdersAccounts.data?.accounts?.map((a) => a.cards)?.flat() as HoldersCard[] || [];

    if (filters?.type !== TransactionType.HOLDERS) {
        return null;
    }

    const isActive = (filters?.cardIds?.length || 0) > 0;
    const activeCards = cards.filter((c) => filters?.cardIds?.includes(c.id)).map((c) => c.lastFourDigits);
    const title = isActive ? `${t('transactions.filter.holders')}: ${activeCards.join(', ')}` : t('transactions.filter.holders');
    const color = isActive ? theme.accent : theme.surfaceOnBg;
    const textColor = isActive ? theme.textUnchangeable : theme.textPrimary;
    const tintColor = isActive ? theme.textUnchangeable : theme.iconPrimary;

    const onPress = () => {
        navigation.navigateTransactionsFilter({ address: addressString, type: 'holders' });
    }
    const clear = () => {
        setFilter((prev) => ({ ...prev, cardIds: undefined }));
    }

    return (
        <Pressable
            style={[styles.chip, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Image
                style={{ height: 16, width: 16, tintColor }}
                source={require('@assets/ic-filter-card.png')}
            />
            <Text style={[Typography.medium15_20, { color: textColor }]}>{title}</Text>
            {isActive &&
                <Pressable
                    style={[styles.clear, { marginRight: -8 }]}
                    onPress={clear}
                    hitSlop={4}
                >
                    <Image
                        style={styles.clear}
                        source={require('@assets/ic-filter-clear.png')}
                    />
                </Pressable>
            }
        </Pressable>
    );
}

const TransactionsFilter = ({ address }: { address: string | Address }) => {

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row', gap: 8 }}
        >
            <HoldersChip address={address} />
        </ScrollView>
    );
};

export const TransactionsHeader = memo(({ showFilters, address }: TransactionsHeaderProps) => {
    const { isTestnet } = useNetwork();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const [filters] = useTransactionsFilter(addressString);

    if (!showFilters) {
        return (
            <PendingTransactions
                viewType={'history'}
                address={addressString}
            />
        );
    }

    return (
        <View>
            <TransactionsFilter address={addressString} />
            {filters?.type !== TransactionType.HOLDERS && (
                <PendingTransactions
                    viewType={'history'}
                    address={addressString}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    chip: {
        height: 32,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6, justifyContent: 'center', alignItems: 'center',
        marginVertical: 16
    },
    clear: {
        height: 20, width: 20,
        borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    }
});