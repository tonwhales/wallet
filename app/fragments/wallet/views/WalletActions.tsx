import { memo } from "react";
import { Platform, View } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { WalletActionButton } from "./WalletActionButton";
import { isNeocryptoAvailable } from "../../../utils/isNeocryptoAvailable";

export const WalletActions = memo(({ theme, navigation, isTestnet }: { theme: ThemeType, navigation: TypedNavigation, isTestnet: boolean }) => {
    const showBuy = isNeocryptoAvailable();
    return (
        <View style={{ paddingHorizontal: 16 }}>
            <View style={{
                backgroundColor: theme.backgroundUnchangeable,
                position: 'absolute', top: Platform.OS === 'android' ? -1 : 0, left: 0, right: 0,
                height: '50%',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
            }} />
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
                        type={'buy'}
                        navigation={navigation}
                        theme={theme}
                    />
                )}
                <WalletActionButton
                    type={'receive'}
                    navigation={navigation}
                    theme={theme}
                />
                {!isTestnet && (
                    <WalletActionButton
                        type={'swap'}
                        navigation={navigation}
                        theme={theme}
                    />
                )}
                <WalletActionButton
                    type={'send'}
                    navigation={navigation}
                    theme={theme}
                />
            </View>
        </View>
    );
});