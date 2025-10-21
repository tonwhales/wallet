import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Platform, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useTheme } from "../../../engine/hooks";
import { Address, toNano } from "@ton/core";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import { SelectedWallet } from "../../../components/wallet/SelectedWallet";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { PriceComponent } from "../../../components/PriceComponent";
import { Typography } from "../../../components/styles";
import { useRates } from "../../../engine/hooks/currency/useRates";

import IcRateChevron from '@assets/ic_rate_chevron.svg';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const WalletHeader = memo(({ address, height, walletCardHeight, scrollOffsetSv }: { address: Address, height: number, walletCardHeight: number, scrollOffsetSv: SharedValue<number> }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [isWalletMode] = useAppMode(address);
    const { data: rates } = useRates(['ton'], ['usd']);
    const diff = rates?.rates?.TON?.diff24h?.USD;
    const isNegative = diff?.startsWith('−');
    const diffPercent = diff?.replace(/^[+−]/, '');
    const diffTextColor = isNegative ? theme.accentRed : theme.accentGreen;
    const diffBackgroundColor = isNegative ? theme.accentRed + '30' : theme.accentGreen + '30';

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

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    const headerContentAnimatedStyle = useAnimatedStyle(() => {
        const showToggle = scrollOffsetSv.value > 0;
        return {
            opacity: withTiming(showToggle ? 0 : 1, { duration: 200 }),
            flexDirection: 'row',
        };
    });

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
                showsVerticalScrollIndicator={false}
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
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
            }}>
                <SelectedWallet headerContentAnimatedStyle={headerContentAnimatedStyle} />
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {isWalletMode && (
                        <Animated.View style={headerContentAnimatedStyle}>
                            <Pressable
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={navigateToCurrencySettings}
                            >
                                <PriceComponent
                                    showSign
                                    amount={toNano(1)}
                                    style={{ backgroundColor: 'transparent', paddingHorizontal: 6 }}
                                    textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                    theme={theme}
                                />

                            </Pressable>
                            {!!diff && (
                                <View
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: diffBackgroundColor, paddingHorizontal: 6, borderRadius: 20 }}
                                >
                                    <IcRateChevron
                                        width={12}
                                        height={12}
                                        color={diffTextColor}
                                        style={{
                                            transform: [{ rotate: isNegative ? '180deg' : '0deg' }],
                                            marginRight: 4
                                        }}
                                    />
                                    <Text style={[Typography.medium15_20, { color: diffTextColor }]}>
                                        {diffPercent}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
});

WalletHeader.displayName = 'WalletHeader';