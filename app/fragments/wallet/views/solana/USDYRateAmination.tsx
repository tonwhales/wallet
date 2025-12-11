import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ArrowIcon from '@assets/order/arrow-without-background.svg';
import { useTheme } from "../../../../engine/hooks";
import { Typography } from "../../../../components/styles";
import { AnimatedNumber } from "../../../../components/AnimatedNumber";

export const USDYRateAmination = memo(({ usdyRate, currentPrice, amount }: { usdyRate: number, currentPrice: number, amount: number }) => {
    const [animatedPrice, setAnimatedPrice] = useState(currentPrice);
    const theme = useTheme();

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedPrice(prev => {
                const increment = (usdyRate / 100) / 365 / 24 / 3600;
                return prev + increment;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [usdyRate]);

    const usdValue = amount * animatedPrice;

    return (
        <View style={styles.container}>
            <View style={styles.priceContainer}>
                <View style={{ transform: [{ rotate: '45deg' }] }}>
                    <ArrowIcon
                        width={16}
                        height={16}
                        color={theme.accentGreen}
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedNumber
                        number={usdValue}
                        duration={800}
                        typography={Typography.medium17_24}
                        color={theme.accentGreen}
                        decimalPlaces={6}
                    />
                    <Text style={[styles.priceText, { color: theme.accentGreen, marginLeft: 4 }, Typography.medium17_24]}>
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