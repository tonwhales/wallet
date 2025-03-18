import React, { memo } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Typography } from "../../../../components/styles";
import { AddressInputAvatar } from "../../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../../utils/avatarHash";
import { avatarColors } from "../../../../components/avatar/Avatar";
import { t } from "../../../../i18n/t";
import { ValueComponent } from "../../../../components/ValueComponent";
import { formatTime } from "../../../../utils/dates";
import { toNano } from "@ton/core";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../../utils/withDecimals";
import { SolanaAccountData, SolanaTokenTransfer, SolanaTransaction } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { useTheme } from "../../../../engine/hooks/theme";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { useSolanaToken } from "../../../../engine/hooks";

export const SolanaTokenTransferView = memo(({ transfer, owner, accountData, item }: { transfer: SolanaTokenTransfer, owner: string, accountData: SolanaAccountData, item: SolanaTransaction }) => {
  const { fromUserAccount, toTokenAccount, tokenAmount, mint } = transfer;
  const kind: 'in' | 'out' = fromUserAccount === owner ? 'out' : 'in';
  const theme = useTheme();
  const op = kind === 'in' ? t('tx.received') : t('tx.sent');
  const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
  const avatarColor = avatarColors[avatarHash(fromUserAccount, avatarColors.length)];
  const toAccount = accountData?.find((acc) => acc.account === toTokenAccount);
  const toAddress = toAccount?.tokenBalanceChanges.find((change) => change.tokenAccount === toTokenAccount)?.userAccount;
  const address = kind === 'in' ? fromUserAccount : toAddress;
  const amount = fromBnWithDecimals(toNano(tokenAmount), 9);
  const navigation = useTypedNavigation();
  const tokenInfo = useSolanaToken(owner, mint);
  const symbol = tokenInfo?.symbol;
  const decimals = tokenInfo?.decimals;

  const navigate = () => {
    navigation.navigateSolanaTransaction({
      owner,
      transaction: item,
      transfer: { data: transfer, type: 'token' }
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
          {formatTime(item.timestamp)}
        </Text>
      </View>
      <View>
        <Text style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
          numberOfLines={1}>
          {kind === 'in' ? '+' : '-'}
          <ValueComponent
            precision={2}
            decimals={decimals ?? 6}
            value={toBnWithDecimals(amount, decimals ?? 6)}
            suffix={` ${symbol ?? 'USDC'}`}
            centFontStyle={{ fontSize: 15 }}
          />
        </Text>
      </View>
    </Pressable>
  )
});