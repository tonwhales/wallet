import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Image, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { Address } from "@ton/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { SelectedWallet } from "../../../components/wallet/SelectedWallet";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const WalletHeader = memo(({ address, height, walletCardHeight, scrollOffsetSv }: { address: Address, height: number, walletCardHeight: number, scrollOffsetSv: SharedValue<number> }) => {
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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: scrollOffsetSv.value < 0 ? 0 : -scrollOffsetSv.value
            }
        ],
        opacity: scrollOffsetSv.value <= 0 ? 0 : 1,

    }))

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        backgroundColor: scrollOffsetSv.value <= 0 ? 'transparent' : theme.backgroundUnchangeable,
    }))

    return (
        <Animated.View
            style={[containerAnimatedStyle, {
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                position: 'absolute',
                top: 0,
                zIndex: 1,
                width: '100%',
            }]}
            collapsable={false}
        >
            <ScrollView
                scrollEnabled={false}
                style={{ position: 'absolute', height, width: '100%' }}
                contentContainerStyle={[{ height: walletCardHeight }]}
            >
                <AnimatedLinearGradient
                    style={[animatedStyle, {
                        height: walletCardHeight,
                        width: '100%',
                        opacity: 0,
                    }]}
                    colors={[isWalletMode ? theme.backgroundUnchangeable : theme.cornflowerBlue, theme.backgroundUnchangeable]}
                    start={[1, 0]}
                    end={[1, 1]}
                />
            </ScrollView>
            <View style={{
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
                paddingHorizontal: 16,
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
        </Animated.View>
    );
});

WalletHeader.displayName = 'WalletHeader';