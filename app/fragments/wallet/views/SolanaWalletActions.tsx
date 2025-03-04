import { memo } from "react";
import { Platform, View } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { WalletActionButton, WalletActionType } from "./WalletActionButton";
import { isNeocryptoAvailable } from "../../../utils/isNeocryptoAvailable";
import { useAppConfig } from "../../../engine/hooks/useAppConfig";
import { SolanaAddress } from "../../../utils/solana/core";

// Placeholder for Solana wallet type
type SolanaWallet = {
  balance: bigint;
  decimals: number;
  symbol: string;
  prices?: Record<string, string>;
};

type SolanaAsset = {
  type: 'solana';
  solana: SolanaWallet;
};

export const SolanaWalletActions = memo(({
  theme,
  navigation,
  isTestnet,
  address,
  isLedger,
  solanaWallet
}: {
  theme: ThemeType;
  navigation: TypedNavigation;
  isTestnet: boolean;
  address?: SolanaAddress;
  isLedger?: boolean;
  solanaWallet: SolanaWallet;
}) => {
  const showBuy = isNeocryptoAvailable() && !isLedger;
  const appConfig = useAppConfig();
  // TODO: rm platform check after review
  // don't show swap on iOS until the issue with review is resolved
  const showSwap = appConfig?.features?.swap && Platform.OS === 'android' && !isLedger;
  
  // For Solana, we always use the Receive button (not Deposit)
  const receiveType = WalletActionType.Receive;
  
  // Create a TON asset for compatibility with existing components
  const asset = { type: 'ton' as const };

  return (
    <View style={{ paddingHorizontal: 16, width: '100%' }}>
      <View
        style={{
          marginTop: 28,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          backgroundColor: theme.surfaceOnBg,
          borderRadius: 20,
          overflow: 'hidden',
          height: 96,
          paddingBottom: 2,
        }}
        collapsable={false}
      >
        {!isTestnet && showBuy && (
          <WalletActionButton
            action={{ type: WalletActionType.Buy }}
            navigation={navigation}
            theme={theme}
            isLedger={isLedger}
          />
        )}
        <WalletActionButton
          action={{ type: receiveType, asset }}
          navigation={navigation}
          theme={theme}
          isLedger={isLedger}
        />
        {!isTestnet && showSwap && (
          <WalletActionButton
            action={{ type: WalletActionType.Swap }}
            navigation={navigation}
            theme={theme}
            isLedger={isLedger}
          />
        )}
        <WalletActionButton
          action={{ type: WalletActionType.Send }}
          navigation={navigation}
          theme={theme}
          isLedger={isLedger}
        />
      </View>
    </View>
  );
}); 