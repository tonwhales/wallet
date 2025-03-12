import { memo } from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { WalletActionButton, WalletActionType } from "./WalletActionButton";

export const SolanaWalletActions = memo(({
  style,
  theme,
  navigation,
  isTestnet,
  address,
  token
}: {
  style?: StyleProp<ViewStyle>;
  theme: ThemeType;
  navigation: TypedNavigation;
  isTestnet: boolean;
  address?: string;
  token?: string;
}) => {
  const receiveType = WalletActionType.Receive;

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
          action={{ type: receiveType, asset: { type: 'solana', token } }}
          navigation={navigation}
          theme={theme}
        />
        <WalletActionButton
          action={{ type: WalletActionType.SendSolana, token }}
          navigation={navigation}
          theme={theme}
        />
      </View>
    </View>
  );
}); 