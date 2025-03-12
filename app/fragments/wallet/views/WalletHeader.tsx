import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { Address } from "@ton/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { SelectedWallet } from "../../../components/wallet/SelectedWallet";

export const WalletHeader = memo(({ address }: { address: Address }) => {
    const network = useNetwork();
    const theme = useTheme();
    const bottomBarHeight = useBottomTabBarHeight();
    const linkNavigator = useLinkNavigator(network.isTestnet, { marginBottom: Platform.select({ ios: 16 + bottomBarHeight, android: 16 }) });
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [isWalletMode] = useAppMode(address);

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };
    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    return (
        <View
            style={{
                backgroundColor: theme.backgroundUnchangeable,
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                paddingHorizontal: 16
            }}
            collapsable={false}
        >
            <View style={{
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6
            }}>
                <SelectedWallet />
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {isWalletMode && (
                        <Pressable
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                                height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                                borderRadius: 16
                            })}
                            onPress={openScanner}
                        >
                            <Image
                                source={require('@assets/ic-scan-main.png')}
                                style={{
                                    height: 22,
                                    width: 22,
                                    tintColor: theme.iconUnchangeable
                                }}
                            />
                        </Pressable>
                    )}
                </View>
            </View >
        </View>
    );
});

WalletHeader.displayName = 'WalletHeader';