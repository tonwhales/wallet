import React, { memo, ReactNode } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Text } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../components/styles";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { SolanaParsedTransaction } from "../../../engine/hooks/solana/useSolanaTransactions";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../utils/avatarHash";
import { avatarColors } from "../../../components/avatar/Avatar";
import { t } from "../../../i18n/t";
import { ValueComponent } from "../../../components/ValueComponent";
import { formatTime } from "../../../utils/dates";

type SolanaTransactionsProps = {
  theme: ThemeType;
  navigation: any;
  txs: SolanaParsedTransaction[];
  hasNext: boolean;
  address: string;
  safeArea: EdgeInsets;
  onLoadMore: () => void;
  onRefresh: () => void;
  loading: boolean;
  ledger?: boolean;
  header: ReactNode;
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
  ledger,
  header,
  owner
}: SolanaTransactionsProps) => {

  // This would render transaction items
  const renderItem = ({ item }: { item: SolanaParsedTransaction }) => {
    const programms = item.meta?.loadedAddresses;
    console.log({ programms });

    const accountKeys = item.transaction.message.accountKeys.filter((k) => {
      if (k === '11111111111111111111111111111111') {
        return false;
      }
      if (k === 'SysvarRent11111111111111111111111111111111') {
        return false;
      }
      if (k === 'ComputeBudget111111111111111111111111111111') {
        return false;
      }
      if (k === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
        return false;
      }
      console.log(k.toString());
      return true;
    });

    const firstIsOwner = item.transaction.message.accountKeys[0].toString() === owner && accountKeys.length > 1;

    const kind: 'in' | 'out' = accountKeys[0].toString() === owner ? 'out' : 'in';
    const instructions = item.transaction.message.instructions;
    console.log(instructions);
    const memoInstraction = instructions.find((i) => {
      return i;
      // if (i.type === 'addMemo') {
      //   return i;
      // }
    });

    return (
      <View style={[styles.transactionItem, { backgroundColor: theme.surfaceOnBg, gap: 2 }]}>
        {accountKeys.map((key, index) => {
          const isOwner = key.toString() === owner;
          if (isOwner && firstIsOwner) {
            return null;
          }
          // 0 index is sender, so we don't show it

          const op = kind === 'in' ? t('tx.received') : t('tx.sent');
          const balanceBefore = item.meta?.postBalances[index];
          const balanceAfter = item.meta?.postBalances[index + 1];
          const balanceChange = balanceBefore ? balanceAfter ? balanceBefore - balanceAfter : balanceBefore : 0n;

          const avatarColorHash = avatarHash(key, avatarColors.length);
          const avatarColor = avatarColors[avatarColorHash];
          const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
          const time = item.blockTime;
          const timeString = formatTime(Number(time))
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: theme.surfaceOnBg,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <AddressInputAvatar
                  size={46}
                  theme={theme}
                  isOwn={false}
                  markContact={false}
                  friendly={key}
                  avatarColor={avatarColor}
                  knownWallets={{}}
                  hash={null}
                />
              </View>
              <View style={{ flex: 1, marginRight: 4 }}>
                <Text
                  style={[
                    { color: theme.textPrimary, flexShrink: 1 },
                    Typography.semiBold17_24
                  ]}
                  ellipsizeMode={'tail'}
                  numberOfLines={1}
                >
                  {op}
                </Text>
                <Text style={[
                  { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                  Typography.regular15_20
                ]}>
                  {key.slice(0, 4)}...{key.slice(-4)}
                  {' • '}
                  {timeString}
                </Text>
              </View>
              <View>
                <Text style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
                  numberOfLines={1}>
                  {kind === 'in' ? '+' : '-'}
                  <ValueComponent
                    value={balanceChange}
                    precision={3}
                    decimals={9}
                    suffix="SOL"
                    centFontStyle={{ fontSize: 15 }}
                  />
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    );
  };

  return (
    <FlatList
      data={txs}
      keyExtractor={(item) => item.slot.toString()}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: 16, paddingBottom: 86 },
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