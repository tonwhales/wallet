import React, { useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { ProductBanner } from "./ProductBanner";
import { useHoldersCards, useNetwork, useStaking, useStakingApy, useTheme } from "../../engine/hooks";
import { getCurrentAddress } from "../../storage/appState";

import StakingIcon from '@assets/ic-staking.svg';

const style: StyleProp<ViewStyle> = {
    height: 84,
    borderRadius: 20,
    marginVertical: 4,
    padding: 20
}

const icStyle: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    marginRight: 12
}

const icStyleInner: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    borderRadius: 23,
    alignItems: 'center', justifyContent: 'center'
}

const titleStyle: StyleProp<TextStyle> = {
    fontSize: 17, fontWeight: '600',
    lineHeight: 24
}

const subtitleStyle: StyleProp<TextStyle> = {
    fontSize: 15, fontWeight: '400',
    lineHeight: 20
}

export const StakingProductComponent = React.memo(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const acc = getCurrentAddress();
    const cards = useHoldersCards(acc.address).data ?? [];
    const totalStaked = useStaking().total;
    const showJoin = totalStaked === 0n;

    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    if (!showJoin) {
        return (
            <Pressable
                onPress={() => navigation.navigate('StakingPools')}
                style={({ pressed }) => {
                    return [style, { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg }]
                }}
            >
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={icStyle}>
                        <View style={{ backgroundColor: theme.accent, ...icStyleInner }}>
                            <StakingIcon width={32} height={32} color={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        flexGrow: 1, flexShrink: 1, alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}>
                        <View style={{ flexGrow: 1, flexShrink: 1 }}>
                            <Text
                                style={{ color: theme.textPrimary, ...titleStyle }}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{ color: theme.textSecondary, ...subtitleStyle, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                {t("products.staking.subtitle.joined", { apy: apyWithFee ?? '8' })}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: theme.textPrimary, ...titleStyle }}>
                                <ValueComponent
                                    value={totalStaked}
                                    precision={3}
                                />
                                <Text style={{ opacity: 0.5 }}>
                                    {' TON'}
                                </Text>
                            </Text>
                            <PriceComponent
                                amount={totalStaked}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined
                                }}
                                textStyle={{ color: theme.textSecondary, ...subtitleStyle }}
                            />
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }

    if (cards.length > 0) {
        return null;
    }

    return (
        <ProductBanner
            onPress={() => navigation.navigate('StakingPools')}
            title={t('products.staking.title')}
            subtitle={network.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
            illustration={require('@assets/banners/banner-staking.png')}
        />
    );
})