import React, { memo, ReactNode, useMemo } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Text, SectionList, SectionListData, Pressable } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { EdgeInsets } from "react-native-safe-area-context";
import { Typography } from "../../../components/styles";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../utils/avatarHash";
import { avatarColors } from "../../../components/avatar/Avatar";
import { t } from "../../../i18n/t";
import { ValueComponent } from "../../../components/ValueComponent";
import { formatDate, getDateKey, formatTime } from "../../../utils/dates";
import { SolanaTransaction } from "../../../engine/api/solana/fetchSolanaTransactions";
import { TransactionsSectionHeader } from "./TransactionsSectionHeader";
import { toNano } from "@ton/core";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";
import { TypedNavigation } from "../../../utils/useTypedNavigation";

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

  const renderItem = ({ item }: { item: SolanaTransaction }) => {
    const { description, type, source, fee, feePayer, signature, slot, timestamp, tokenTransfers, nativeTransfers, accountData } = item;

    return (
      <View style={[styles.transactionItem, { gap: 2 }]}>
        {nativeTransfers?.map((tx, index) => {
          const { fromUserAccount, toUserAccount, amount } = tx;
          const kind: 'in' | 'out' = fromUserAccount === owner ? 'out' : 'in';
          const op = kind === 'in' ? t('tx.received') : t('tx.sent');
          const address = kind === 'in' ? fromUserAccount : toUserAccount;
          const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
          const avatarColor = avatarColors[avatarHash(address, avatarColors.length)];

          const navigate = () => {
            navigation.navigateSolanaTransaction({
              owner,
              transaction: item,
              transfer: { data: tx, type: 'native' }
            });
          }

          return (
            <Pressable
              onPress={navigate}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}
            >
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
                  friendly={address}
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
                  {address.slice(0, 4)}...{address.slice(-4)}
                  {' • '}
                  {formatTime(timestamp)}
                </Text>
              </View>
              <View>
                <Text style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
                  numberOfLines={1}>
                  {kind === 'in' ? '+' : '-'}
                  <ValueComponent
                    value={BigInt(amount)}
                    precision={2}
                    suffix=" SOL"
                    centFontStyle={{ fontSize: 15 }}
                  />
                </Text>
              </View>
            </Pressable>
          )
        })}
        {tokenTransfers?.map((tx, index) => {
          const { fromUserAccount, toTokenAccount, tokenAmount, } = tx;
          const kind: 'in' | 'out' = fromUserAccount === owner ? 'out' : 'in';
          const op = kind === 'in' ? t('tx.received') : t('tx.sent');
          const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
          const avatarColor = avatarColors[avatarHash(fromUserAccount, avatarColors.length)];
          const toAccount = accountData?.find((acc) => acc.account === toTokenAccount);
          const toAddress = toAccount?.tokenBalanceChanges.find((change) => change.tokenAccount === toTokenAccount)?.userAccount;
          const address = kind === 'in' ? fromUserAccount : toAddress;
          const amount = fromBnWithDecimals(toNano(tokenAmount), 9);

          const navigate = () => {
            navigation.navigateSolanaTransaction({
              owner,
              transaction: item,
              transfer: { data: tx, type: 'token' }
            });
          }

          return (
            <Pressable
              onPress={navigate}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}
            >
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
                  friendly={address}
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
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                  {' • '}
                  {formatTime(timestamp)}
                </Text>
              </View>
              <View>
                <Text style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
                  numberOfLines={1}>
                  {kind === 'in' ? '+' : '-'}
                  <ValueComponent
                    precision={2}
                    // TODO: get decimals from token
                    decimals={6}
                    value={toBnWithDecimals(amount, 6)}
                    // TODO: get symbol from token
                    suffix=" USDC"
                    centFontStyle={{ fontSize: 15 }}
                  />
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View >
    );
  };

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