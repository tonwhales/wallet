import { memo } from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { WalletActionButton, WalletActionType } from "./WalletActionButton";
import { SolanaAddress } from "../../../utils/solana/core";

export const SolanaWalletActions = memo(({
  style,
  theme,
  navigation,
  isTestnet,
  address
}: {
  style?: StyleProp<ViewStyle>;
  theme: ThemeType;
  navigation: TypedNavigation;
  isTestnet: boolean;
  address?: SolanaAddress;
}) => {
  // For Solana, we always use the Receive button (not Deposit)
  const receiveType = WalletActionType.Receive;

  // Create a TON asset for compatibility with existing components
  const asset = { type: 'ton' as const };

  return (
    <View style={[{ paddingHorizontal: 16, width: '100%' }, style]}>
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
        <WalletActionButton
          action={{ type: receiveType, asset }}
          navigation={navigation}
          theme={theme}
          solana
        />
        <WalletActionButton
          action={{ type: WalletActionType.Send }}
          navigation={navigation}
          theme={theme}
          solana
        />
      </View>
    </View>
  );
}); 