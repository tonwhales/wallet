import React, { useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { ProductBanner } from "./ProductBanner";
import { useNetwork, useStaking, useStakingApy, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";

import StakingIcon from '@assets/ic-staking.svg';

const style: StyleProp<ViewStyle> = {
    height: 84,
    borderRadius: 20,
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

export const LedgerStakingProductComponent = React.memo(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const address = useMemo(() => {
        if (!ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch {
            return;
        }
    }, [ledgerContext?.addr?.address]);

    const staking = useStaking(address!);
    const showJoin = staking.total === 0n;

    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    if (!showJoin) {
        return (
            <Pressable
                onPress={() => navigation.navigate('LedgerStakingPools')}
                style={({ pressed }) => {
                    return [style, { backgroundColor: theme.surfaceOnBg, opacity: pressed ? 0.5 : 1 }]
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
                                    value={staking.total}
                                    precision={3}
                                />
                                <Text style={{ opacity: 0.5 }}>
                                    {' TON'}
                                </Text>
                            </Text>
                            <PriceComponent
                                amount={staking.total}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: 'auto'
                                }}
                                textStyle={{ color: theme.textSecondary, ...subtitleStyle }}
                                theme={theme}
                            />
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <ProductBanner
            onPress={() => navigation.navigate('LedgerStakingPools')}
            title={t('products.staking.title')}
            subtitle={network.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
            illustration={require('@assets/banners/banner-staking.webp')}
        />
    );
})