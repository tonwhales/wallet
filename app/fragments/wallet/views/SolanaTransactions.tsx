import React, { memo, ReactNode } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Text } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../components/styles";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { SolanaAddress } from "../../../utils/solana/core";

// Placeholder type
type SolanaWallet = {
  balance: bigint;
  decimals: number;
  symbol: string;
  prices?: Record<string, string>;
};

type SolanaTransaction = {
  // Placeholder for transaction data
  id: string;
};

type SolanaTransactionsProps = {
  solanaWallet: SolanaWallet;
  theme: ThemeType;
  navigation: any;
  txs: SolanaTransaction[];
  hasNext: boolean;
  address: SolanaAddress;
  safeArea: EdgeInsets;
  onLoadMore: () => void;
  onRefresh: () => void;
  loading: boolean;
  ledger?: boolean;
  header: ReactNode;
};

export const SolanaTransactions = memo(({
  solanaWallet,
  theme,
  navigation,
  txs,
  hasNext,
  address,
  safeArea,
  onLoadMore,
  onRefresh,
  loading,
  ledger,
  header
}: SolanaTransactionsProps) => {

  // This would render transaction items
  const renderItem = ({ item }: { item: SolanaTransaction }) => {
    return (
      <View style={[styles.transactionItem, { backgroundColor: theme.surfaceOnBg }]}>
        <Text style={[styles.transactionText, { color: theme.textPrimary }]}>
          Transaction: {item.id}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={txs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: 16 }
      ]}
      ListHeaderComponent={() => <>{header}</>}
      ListEmptyComponent={loading ? <TransactionsSkeleton /> : <TransactionsEmptyState isLedger={ledger} />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    />
  );
});

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    padding: 16,
  },
  emptyImage: {
    width: 124,
    height: 124,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.semiBold17_24,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.regular15_20,
  },
  transactionItem: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  transactionText: {
    ...Typography.regular15_20,
  }
}); 