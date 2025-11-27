import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import ArrowIcon from '@assets/order/arrow-without-background.svg';
import { useTheme } from "../../../../engine/hooks";
import { Typography } from "../../../../components/styles";

export const USDYRateAmination = memo(({ usdyRate, currentPrice, amount }: { usdyRate: number, currentPrice: number, amount: number }) => {
    const [animatedPrice, setAnimatedPrice] = useState(currentPrice);
    const theme = useTheme();

    // Animation values for the arrow
    const arrowScale = useSharedValue(1);
    const arrowTranslateX = useSharedValue(0);
    const arrowTranslateY = useSharedValue(0);

    // Animate price growth every second
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedPrice(prev => {
                // Simulate gradual price growth (small increment)
                const increment = (usdyRate / 100) / 365 / 24 / 3600; // Convert APY to per-second growth
                return prev + increment;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [usdyRate]);

    // Animate arrow pulsation and up-right movement
    useEffect(() => {
        // Pulsating scale animation (reduced scale)
        arrowScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 800, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 800, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );

        arrowTranslateX.value = withRepeat(
            withSequence(
                withTiming(1.5, { duration: 800, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );

        arrowTranslateY.value = withRepeat(
            withSequence(
                withTiming(-1.5, { duration: 800, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );
    }, []);

    // Format price to 7 decimal places
    const formatPrice = (price: number): string => {
        return price.toFixed(7);
    };

    // Calculate USD value and rate calculation
    const usdValue = amount * animatedPrice;

    // Animated style for the arrow
    const arrowAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: arrowScale.value },
                { translateX: arrowTranslateX.value },
                { translateY: arrowTranslateY.value },
                { rotate: '45deg' } // Rotate to point up-right
            ]
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.priceContainer}>
                <Text style={[styles.priceText, { color: theme.accentGreen }, Typography.semiBold32_38]}>
                    {`${formatPrice(usdValue)}$`}
                </Text>
                <Animated.View style={arrowAnimatedStyle}>
                    <ArrowIcon
                        width={32}
                        height={32}
                        color={theme.accentGreen}
                    />
                </Animated.View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
    },
});