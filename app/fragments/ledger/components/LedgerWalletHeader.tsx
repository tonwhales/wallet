import { memo, useCallback } from "react";
import { Pressable, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useNetwork, useTheme } from '../../../engine/hooks';
import { useLedgerTransport } from "./TransportContext";
import { Address, toNano } from "@ton/core";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { SelectedWallet } from "../../../components/wallet/SelectedWallet";
import { PriceComponent } from "../../../components/PriceComponent";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const LedgerWalletHeader = memo(({ address, height, walletCardHeight, scrollOffsetSv }: { address: Address, height: number, walletCardHeight: number, scrollOffsetSv: SharedValue<number> }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const [isWalletMode] = useAppMode(address, { isLedger: true });
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
                paddingBottom: 8,
                paddingHorizontal: 16,
            }}>
                <SelectedWallet ledgerName={ledgerContext.ledgerName} />
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {isWalletMode && (
                        <Pressable
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={navigateToCurrencySettings}
                        >
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: 'transparent' }}
                                textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                theme={theme}
                            />
                        </Pressable>
                    )}
                </View>
            </View>
        </Animated.View>
    );
});