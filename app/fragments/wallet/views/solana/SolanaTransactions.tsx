import React, { memo, useCallback, useMemo } from "react";
import { View, StyleSheet, SectionList, SectionListData } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../../components/styles";
import { TransactionsSkeleton } from "../../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "../TransactionsEmptyStateView";
import { formatDate, getDateKey } from "../../../../utils/dates";
import { TransactionsSectionHeader } from "../TransactionsSectionHeader";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ReAnimatedCircularProgress } from "../../../../components/CircularProgress/ReAnimatedCircularProgress";
import { UnifiedSolanaTransaction } from "../../../../engine/types/unifiedTransaction";
import { UnifiedSolanaTransactionView } from "../UnifiedSolanaTransactionView";

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
  pendingCount
}: SolanaTransactionsProps) => {
  const bottomBarHeight = useBottomTabBarHeight();
  const { transactionsSections } = useMemo(() => {
    const sectioned = new Map<string, { title: string, data: UnifiedSolanaTransaction[] }>();
    for (let i = 0; i < txs.length; i++) {
      const unifiedTx = txs[i];
      const time = getDateKey(unifiedTx.time);
      const section = sectioned.get(time);

      if (unifiedTx.type === 'blockchain') {
        const tx = unifiedTx.data;
        const addToSection = asset
          ? true
          : 'nativeTransfers' in tx && tx.nativeTransfers.some((transfer: any) => transfer.toUserAccount === owner || transfer.fromUserAccount === owner);

        if (!addToSection) {
          continue;
        }
      }

      if (section) {
        section.data.push(unifiedTx);
      } else {
        sectioned.set(time, { title: formatDate(unifiedTx.time), data: [unifiedTx] });
      }
    }

    return { transactionsSections: Array.from(sectioned.values()) };
  }, [txs, owner, asset]);

  const renderSectionHeader = (section: { section: SectionListData<any, { title: string }> }) => (
    <TransactionsSectionHeader theme={theme} title={section.section.title} />
  );

  const renderItem = useCallback(({ item }: { item: UnifiedSolanaTransaction }) => {
    return (
      <UnifiedSolanaTransactionView
        item={item}
        owner={owner}
        asset={asset}
      />
    );
  }, [owner, asset]);

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <TransactionsSkeleton />;
    }
    return <TransactionsEmptyState type={TransactionsEmptyStateType.Solana} addr={owner} asset={asset} />;
  }, [loading, owner, asset]);

  const ListFooterComponent = useMemo(() => {
    if (hasNext) {
      return (
        <View style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <ReAnimatedCircularProgress
            size={24}
            color={theme.iconPrimary}
            reverse
            infinitRotate
            progress={0.8}
          />
        </View>
      );
    }
    return null;
  }, [hasNext, theme]);

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
      ListFooterComponent={ListFooterComponent}
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