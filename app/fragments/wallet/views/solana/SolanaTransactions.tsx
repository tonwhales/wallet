import React, { memo, useCallback, useMemo } from "react";
import { View, StyleSheet, SectionList, SectionListData } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../../components/styles";
import { TransactionsSkeleton } from "../../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState } from "../TransactionsEmptyStateView";
import { formatDate, getDateKey } from "../../../../utils/dates";
import { SolanaTransaction } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { TransactionsSectionHeader } from "../TransactionsSectionHeader";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaTokenTransferView } from "./SolanaTokenTransferView";
import { SolanaNativeTransferView } from "./SolanaNativeTransferView";

type SolanaTransactionsProps = {
  theme: ThemeType;
  navigation: TypedNavigation;
  txs: SolanaTransaction[];
  hasNext: boolean;
  address: string;
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
};

export const SolanaTransactions = memo(({
  theme,
  navigation,
  txs,
  hasNext,
  address,
  safeArea,
  onLoadMore,
  onRefresh,
  loading,
  refreshing,
  ledger,
  header,
  owner
}: SolanaTransactionsProps) => {

  const { transactionsSections } = useMemo(() => {
    const sectioned = new Map<string, { title: string, data: SolanaTransaction[] }>();
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const time = tx.timestamp;
      const timeKey = getDateKey(time);
      const section = sectioned.get(timeKey);
      if (section) {
        section.data.push(tx);
      } else {
        sectioned.set(timeKey, { title: formatDate(time), data: [tx] });
      }
    }

    return { transactionsSections: Array.from(sectioned.values()) };
  }, [txs]);

  const renderSectionHeader = (section: { section: SectionListData<any, { title: string }> }) => (
    <TransactionsSectionHeader theme={theme} title={section.section.title} />
  );

  const renderItem = useCallback(({ item }: { item: SolanaTransaction }) => {
    const { description, type, source, fee, feePayer, signature, slot, timestamp, tokenTransfers, nativeTransfers, accountData } = item;

    return (
      <View style={[styles.transactionItem, { gap: 2 }]}>
        {nativeTransfers?.map((tx, index) => {
          return <SolanaNativeTransferView
            key={index}
            transfer={tx}
            owner={owner}
            item={item}
          />
        })}
        {tokenTransfers?.map((tx, index) => {
          return <SolanaTokenTransferView
            key={index}
            transfer={tx}
            owner={owner}
            accountData={accountData}
            item={item}
          />
        })}
      </View >
    );
  }, [navigation, owner, theme]);

  return (
    <SectionList
      sections={transactionsSections}
      keyExtractor={(item) => item.slot.toString()}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: 86 }
      ]}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <TransactionsSkeleton /> : <TransactionsEmptyState isLedger={ledger} />}
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