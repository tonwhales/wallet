import { memo } from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { WalletActionButton, WalletActionType } from "../WalletActionButton";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";

export const SolanaWalletActions = memo(({
  style,
  theme,
  navigation,
  address,
  asset
}: {
  style?: StyleProp<ViewStyle>;
  theme: ThemeType;
  navigation: TypedNavigation;
  address: string;
  asset?: ReceiveableSolanaAsset;
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
          action={{ type: receiveType, asset: { type: 'solana', addr: address, asset } }}
          navigation={navigation}
          theme={theme}
        />
        <WalletActionButton
          action={{ type: WalletActionType.SendSolana, token: asset?.mint }}
          navigation={navigation}
          theme={theme}
        />
      </View>
    </View>
  );
}); 