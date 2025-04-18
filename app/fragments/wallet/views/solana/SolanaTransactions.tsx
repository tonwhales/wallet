import React, { memo, useCallback, useMemo } from "react";
import { View, StyleSheet, SectionList, SectionListData } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../../components/styles";
import { TransactionsSkeleton } from "../../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "../TransactionsEmptyStateView";
import { formatDate, getDateKey } from "../../../../utils/dates";
import { SolanaTransaction } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { TransactionsSectionHeader } from "../TransactionsSectionHeader";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ReAnimatedCircularProgress } from "../../../../components/CircularProgress/ReAnimatedCircularProgress";
import { SolanaTransactionView } from "./SolanaTransactionView";
import { usePendingSolanaActions } from "../../../../engine/hooks";

type SolanaTransactionsProps = {
  theme: ThemeType;
  navigation: TypedNavigation;
  txs: SolanaTransaction[];
  hasNext: boolean;
  safeArea: EdgeInsets;
  onLoadMore: () => void;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  ledger?: boolean;
  header: | React.ComponentType<any>
  | React.ReactElement
  | null
  | undefined;
  owner: string;
  asset?: ReceiveableSolanaAsset;
};

export const SolanaTransactions = memo(({
  theme,
  navigation,
  txs,
  hasNext,
  safeArea,
  onLoadMore,
  onRefresh,
  loading,
  refreshing,
  ledger,
  header,
  owner,
  asset
}: SolanaTransactionsProps) => {
  const bottomBarHeight = useBottomTabBarHeight();
  const { state: pending } = usePendingSolanaActions(owner);
  const hasPendingTxs = pending.length > 0;
  const { transactionsSections } = useMemo(() => {
    const sectioned = new Map<string, { title: string, data: SolanaTransaction[] }>();
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const time = tx.timestamp;
      const timeKey = getDateKey(time);
      const section = sectioned.get(timeKey);

      const addToSection = asset
        ? true
        : tx.nativeTransfers.some((transfer) => transfer.toUserAccount === owner || transfer.fromUserAccount === owner)

      if (!addToSection) {
        continue;
      }

      if (section) {
        section.data.push(tx);
      } else {
        sectioned.set(timeKey, { title: formatDate(time), data: [tx] });
      }
    }

    return { transactionsSections: Array.from(sectioned.values()) };
  }, [txs, owner]);

  const renderSectionHeader = (section: { section: SectionListData<any, { title: string }> }) => (
    <TransactionsSectionHeader theme={theme} title={section.section.title} />
  );

  const renderItem = useCallback(({ item }: { item: SolanaTransaction }) => {
    return (
      <SolanaTransactionView
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
      sections={transactionsSections}
      keyExtractor={(item) => `${item.signature}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentInset={{ bottom: bottomBarHeight }}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      ListEmptyComponent={hasPendingTxs ? undefined : ListEmptyComponent}
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