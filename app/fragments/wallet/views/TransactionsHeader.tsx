import { Address } from "@ton/core";
import { memo } from "react";
import { PendingTransactions } from "./PendingTransactions";
import { useHoldersAccounts, useNetwork, useTheme } from "../../../engine/hooks";
import { View, StyleSheet, Text } from "react-native";
import { useTransactionsFilter } from "../../../engine/hooks/transactions/useTransactionsFilter";
import { TransactionType } from "../../../engine/types";
import { Pressable, ScrollView } from "react-native-gesture-handler";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { Image } from "expo-image";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { HoldersCard } from "../../../engine/api/holders/fetchAccounts";

type TransactionsHeaderProps = {
    showFilters: boolean,
    address: string | Address
}

const TypeChip = ({ address }: { address: string | Address }) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const [filters] = useTransactionsFilter(addressString);

    const title = !!filters?.type ? t(`transactions.filter.${filters.type}`) : t('transactions.filter.any');
    const color = (!filters?.type || filters.type === TransactionType.ANY) ? theme.surfaceOnBg : theme.accent;

    const onPress = () => {
        navigation.navigateTransactionsFilter({ address: addressString, type: 'type' });
    }

    return (
        <Pressable
            style={[styles.chip, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Image style={{ height: 16, width: 16 }} source={require('@assets/ic-funnel.png')} />
            <Text style={[Typography.medium15_20, { color: theme.textPrimary }]}>{title}</Text>
        </Pressable>
    );
}

const HoldersChip = ({ address }: { address: string | Address }) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const [filters] = useTransactionsFilter(addressString);
    const holdersAccounts = useHoldersAccounts(addressString);
    const cards = holdersAccounts.data?.accounts?.map((a) => a.cards)?.flat() as HoldersCard[] || [];

    if (filters?.type === TransactionType.TON) {
        return null;
    }

    const isActive = (filters?.cardIds?.length || 0) > 0;
    const activeCards = cards.filter((c) => filters?.cardIds?.includes(c.id)).map((c) => c.lastFourDigits);
    const title = isActive ? `${t('transactions.filter.holders')}: ${activeCards.join(', ')}` : t('transactions.filter.holders');
    const color = isActive ? theme.accent : theme.surfaceOnBg;

    const onPress = () => {
        navigation.navigateTransactionsFilter({ address: addressString, type: 'holders' });
    }

    return (
        <Pressable
            style={[styles.chip, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Image style={{ height: 16, width: 16 }} source={require('@assets/ic-filter-card.png')} />
            <Text style={[Typography.medium15_20, { color: theme.textPrimary }]}>{title}</Text>
        </Pressable>
    );
}

const TransactionsFilter = ({ address }: { address: string | Address }) => {

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, flexDirection: 'row', gap: 8 }}
        >
            <TypeChip address={address} />
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
            {filters?.type !== TransactionType.HOLDERS && (
                <PendingTransactions
                    viewType={'history'}
                    address={addressString}
                />
            )}
            <TransactionsFilter address={addressString} />
        </View>
    );
});

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6, justifyContent: 'center', alignItems: 'center',
    }
});