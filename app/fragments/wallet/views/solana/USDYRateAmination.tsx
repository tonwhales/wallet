import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextStyle } from "react-native";
import ArrowIcon from '@assets/order/arrow-without-background.svg';
import { useTheme } from "../../../../engine/hooks";
import { Typography } from "../../../../components/styles";
import { AnimatedNumber } from "../../../../components/AnimatedNumber";
import { storage } from "../../../../storage/storage";

const USDY_CACHE_PREFIX = 'usdy_animated_value_';

type USDYRateAnimationProps = {
    usdyRate: number;
    currentPrice: number;
    amount: number;
    cacheKey?: string;
    typography?: {
        fontSize: number;
        lineHeight: number;
        fontWeight?: TextStyle['fontWeight'];
    };
    showIcon?: boolean;
    decimalPlaces?: number;
};

export const USDYRateAmination = memo(({
    usdyRate,
    currentPrice,
    amount,
    cacheKey = 'default',
    typography = Typography.medium17_24,
    showIcon = true,
    decimalPlaces = 6,
}: USDYRateAnimationProps) => {
    // Get cached value from persistent storage or use current price
    const getCachedOrInitialPrice = () => {
        const storageKey = `${USDY_CACHE_PREFIX}${cacheKey}`;
        const cachedValue = storage.getNumber(storageKey);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        return currentPrice;
    };

    const [animatedPrice, setAnimatedPrice] = useState(getCachedOrInitialPrice);
    const theme = useTheme();

    useEffect(() => {
        const storageKey = `${USDY_CACHE_PREFIX}${cacheKey}`;
        const interval = setInterval(() => {
            setAnimatedPrice(prev => {
                const increment = (usdyRate / 100) / 365 / 24 / 3600;
                const newValue = prev + increment;
                // Persist the value to storage
                storage.set(storageKey, newValue);
                return newValue;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [usdyRate, cacheKey]);

    const usdValue = amount * animatedPrice;

    // Scale icon based on typography size
    const iconSize = Math.round(typography.fontSize * 0.8);

    return (
        <View style={styles.container}>
            <View style={styles.priceContainer}>
                {showIcon && (
                    <View style={{ transform: [{ rotate: '45deg' }] }}>
                        <ArrowIcon
                            width={iconSize}
                            height={iconSize}
                            color={theme.accentGreen}
                        />
                    </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedNumber
                        number={usdValue}
                        duration={800}
                        typography={typography}
                        color={theme.accentGreen}
                        decimalPlaces={decimalPlaces}
                    />
                    <Text style={[styles.priceText, { color: theme.accentGreen, marginLeft: 4 }, typography]}>
                        $
                    </Text>
                </View>
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
        gap: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
    },
});