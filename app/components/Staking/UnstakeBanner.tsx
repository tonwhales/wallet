import React, { useLayoutEffect, useRef } from "react"
import { StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import LottieView from 'lottie-react-native';
import BN from "bn.js";
import { fromNano, toNano } from "ton";
import { Theme } from "../../Theme";
import { useEngine } from "../../engine/Engine";
import { AppConfig } from "../../AppConfig";
import { formatNum } from "../../utils/numbers";
import { t } from "../../i18n/t";

export const UnstakeBanner = React.memo((
    {
        member,
        style,
        amount
    }: {
        member: {
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        },
        style?: StyleProp<ViewStyle>,
        amount?: string
    }
) => {
    const engine = useEngine();
    const price = engine.products.price.useState();
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
            return new BN(0);
        }
    }, [validAmount]);
    const estInc = parseFloat(fromNano(value)) * 0.1;
    const estIncPrice = estInc * price!.price.usd;
    const formattedInc = formatNum(estInc < 0.01 ? estInc.toFixed(6) : estInc.toFixed(2));
    const formattedPrice = formatNum(estInc < 0.01 ? estIncPrice.toFixed(6) : estIncPrice.toFixed(2))

    return (
        <View style={{
            backgroundColor: 'white',
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
                color: Theme.textColor,
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: 240,
                marginBottom: 10
            }}>
                {AppConfig.isTestnet
                    ? t('products.staking.banner.estimatedEarningsDev')
                    : t('products.staking.banner.estimatedEarnings',
                        {
                            amount: formattedInc,
                            price: formattedPrice,
                        }
                    )}
            </Text>
            <Text style={{
                color: '#7D858A',
                fontSize: 16,
                fontWeight: '400'
            }}>
                {t('products.staking.banner.message')}
            </Text>
        </View>
    );
})