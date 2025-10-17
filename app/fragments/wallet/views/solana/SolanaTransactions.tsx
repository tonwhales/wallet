import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet, SectionList, SectionListData } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { Typography } from "../../../../components/styles";
import { TransactionsSkeleton } from "../../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "../TransactionsEmptyStateView";
import { TransactionsSectionHeader } from "../TransactionsSectionHeader";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { UnifiedSolanaTransaction } from "../../../../engine/types/unifiedTransaction";
import { UnifiedSolanaTransactionView } from "../UnifiedSolanaTransactionView";
import { useSectionedTransactions } from "../../../../engine/hooks/transactions";
import { TransactionsListFooter } from "../../../../components/transactions/TransactionsListFooter";
import { TransactionType } from "../../../../engine/types";

type SolanaTransactionsProps = {
  theme: ThemeType;
  txs: UnifiedSolanaTransaction[];
  hasNext: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  header: | React.ComponentType<any>
  | React.ReactElement
  | null
  | undefined;
  owner: string;
  asset?: ReceiveableSolanaAsset;
  pendingCount?: number;
  markAsTimedOut: (id: string, txType: TransactionType) => void
};

export const SolanaTransactions = memo(({
  theme,
  txs,
  hasNext,
  onLoadMore,
  onRefresh,
  loading,
  refreshing,
  header,
  owner,
  asset,
  pendingCount,
  markAsTimedOut
}: SolanaTransactionsProps) => {
  const bottomBarHeight = useBottomTabBarHeight();
  
  const filterFn = useCallback((unifiedTx: UnifiedSolanaTransaction) => {
    if (unifiedTx.type === 'blockchain') {
      const tx = unifiedTx.data;
      const addToSection = asset
        ? true
        : 'nativeTransfers' in tx && tx.nativeTransfers.some((transfer: any) => transfer.toUserAccount === owner || transfer.fromUserAccount === owner);

      return addToSection;
    }
    return true;
  }, [owner, asset]);

  const transactionsSections = useSectionedTransactions(txs, filterFn);

  const renderSectionHeader = (section: { section: SectionListData<any, { title: string }> }) => (
    <TransactionsSectionHeader theme={theme} title={section.section.title} />
  );

  const renderItem = useCallback(({ item }: { item: UnifiedSolanaTransaction }) => {
    return (
      <UnifiedSolanaTransactionView
        item={item}
        owner={owner}
        asset={asset}
        markAsTimedOut={markAsTimedOut}
      />
    );
  }, [owner, asset, markAsTimedOut]);

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <TransactionsSkeleton />;
    }
    return <TransactionsEmptyState type={TransactionsEmptyStateType.Solana} addr={owner} asset={asset} />;
  }, [loading, owner, asset]);

  return (
    <SectionList
      style={{ flexGrow: 1, flex: 1 }}
      sections={transactionsSections}
      keyExtractor={(item) => `solana-tx-${item.id}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentInset={{ bottom: bottomBarHeight }}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      ListEmptyComponent={pendingCount ? undefined : ListEmptyComponent}
      ListFooterComponent={<TransactionsListFooter hasNext={hasNext} theme={theme} />}
      onEndReached={onLoadMore}
      initialNumToRender={16}
      scrollEventThrottle={50}
      removeClippedSubviews={true}
      stickySectionHeadersEnabled={false}
      onEndReachedThreshold={0.2}
      onRefresh={onRefresh}
      refreshing={refreshing}
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

SolanaTransactions.displayName = 'SolanaTransactions';