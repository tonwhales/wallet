import React, { useLayoutEffect, useRef } from "react"
import { StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import LottieView from 'lottie-react-native';
import BN from "bn.js";
import { Address, fromNano } from "ton";
import { Theme } from "../../Theme";
import { useTranslation } from "react-i18next";
import { useAccount } from "../../sync/Engine";

export const UnstakeBanner = React.memo((
    {
        member,
        style
    }: {
        member: {
            address: Address,
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        },
        style?: StyleProp<ViewStyle>
    }
) => {
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();
    const { t } = useTranslation();
    const anim = useRef<LottieView>(null);

    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

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
                {t('products.staking.banner.estimatedEarnings',
                    {
                        amount: parseFloat(fromNano(member.balance.add(member.pendingDeposit).muln(0.133))).toFixed(2),
                        price: parseFloat(fromNano(member.balance.add(member.pendingDeposit).muln(0.133).muln(price.price.usd))).toFixed(2)
                    })}
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