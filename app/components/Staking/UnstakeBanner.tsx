import React, { useLayoutEffect, useRef } from "react"
import { StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import LottieView from 'lottie-react-native';
import { fromNano, toNano } from "@ton/core";
import { formatNum } from "../../utils/numbers";
import { t } from "../../i18n/t";
import { formatCurrency } from "../../utils/formatCurrency";
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { usePrice } from '../../engine/hooks/usePrice';

export const UnstakeBanner = React.memo((
    {
        member,
        style,
        amount
    }: {
        member: {
            balance: bigint,
            pendingDeposit: bigint,
            pendingWithdraw: bigint,
            withdraw: bigint
        },
        style?: StyleProp<ViewStyle>,
        amount?: string
    }
) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    
    const [price, currency] = usePrice();
    const anim = useRef<LottieView>(null);

    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    const validAmount = amount?.replace(',', '.') || '0';
    const value = React.useMemo(() => {
        try {
            return toNano(validAmount);
        } catch (error) {
            return BigInt(0);
        }
    }, [validAmount]);
    const estInc = parseFloat(fromNano(value)) * 0.1;
    const estIncPrice = estInc * (price?.price?.usd ?? 0) * (price?.price.rates[currency] ?? 0);
    const formattedInc = formatNum(estInc < 0.01 ? estInc.toFixed(6) : estInc.toFixed(2));
    const formattedPrice = formatCurrency(estInc < 0.01 ? estIncPrice.toFixed(6) : estIncPrice.toFixed(2), currency)

    return (
        <View style={{
            backgroundColor: theme.item,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        }}>
            <LottieView
                ref={anim}
                source={require('../../../assets/animations/money.json')}
                autoPlay={true}
                loop={true}
                style={{ width: 94, height: 94, marginBottom: 16, maxWidth: 140, maxHeight: 140 }}
            />
            <Text style={{
                color: theme.textColor,
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: 240,
                marginBottom: 10
            }}>
                {isTestnet
                    ? t('products.staking.banner.estimatedEarningsDev')
                    : t('products.staking.banner.estimatedEarnings',
                        {
                            amount: formattedInc,
                            price: formattedPrice,
                        }
                    )}
            </Text>
            <Text style={{
                color: theme.label,
                fontSize: 16,
                fontWeight: '400'
            }}>
                {t('products.staking.banner.message')}
            </Text>
        </View>
    );
})