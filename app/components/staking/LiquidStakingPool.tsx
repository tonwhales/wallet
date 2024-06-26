import { memo, useEffect, useMemo, useState } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { KnownPools, getLiquidStakingAddress } from "../../utils/KnownPools";
import { t } from "../../i18n/t";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import { WImage } from "../WImage";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Countdown } from "../Countdown";
import { Address, fromNano, toNano } from "@ton/core";
import { useLiquidStakingMember, useNetwork, useStakingApy, useTheme } from "../../engine/hooks";
import { useLiquidStaking } from "../../engine/hooks/staking/useLiquidStaking";
import { Typography } from "../styles";
import { ItemHeader } from "../ItemHeader";

import StakingIcon from '@assets/ic_staking.svg';

export const LiquidStakingPool = memo((
    props: {
        member: Address,
        restricted?: boolean,
        style?: StyleProp<ViewStyle>,
        hideCycle?: boolean,
        hideHeader?: boolean,
        isLedger?: boolean
        iconBackgroundColor?: string
    }
) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const liquidAddress = getLiquidStakingAddress(network.isTestnet);
    const poolAddressString = liquidAddress.toString({ testOnly: network.isTestnet });
    const nominator = useLiquidStakingMember(props.member)?.data;
    const liquidStaking = useLiquidStaking().data;
    const apy = useStakingApy()?.apy;

    const balance = useMemo(() => {
        const bal = fromNano(nominator?.balance || 0n);
        const rate = fromNano(liquidStaking?.rateWithdraw || 0n);
        return toNano((parseFloat(bal) * parseFloat(rate)).toFixed(9));
    }, [nominator, liquidStaking]);

    const stakeUntil = Math.min(liquidStaking?.extras.proxyZeroStakeUntil ?? 0, liquidStaking?.extras.proxyOneStakeUntil ?? 0);
    const poolFee = liquidStaking?.extras.poolFee ? Number(toNano(fromNano(liquidStaking?.extras.poolFee))) / 100 : undefined;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(apy - apy * (poolFee / 100)).toFixed(2)}%`;
        }
    }, [apy, poolFee]);
    const knownPools = KnownPools(network.isTestnet);
    const requireSource = knownPools[poolAddressString]?.requireSource;
    const name = knownPools[poolAddressString]?.name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : poolAddressString.slice(0, 10) + '...' + poolAddressString.slice(poolAddressString.length - 6);


    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((stakeUntil) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [stakeUntil]);

    return (
        <View style={[{ borderRadius: 20 }, props.style]}>
            {!props.hideHeader && (
                <View style={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 16
                }}>
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ItemHeader
                            title={t('products.staking.pools.liquid')}
                            style={{ flexShrink: 1 }}
                            textStyle={{ flexGrow: 0 }}
                        />
                        <View style={{
                            backgroundColor: theme.accentBlue,
                            paddingHorizontal: 8, borderRadius: 30,
                            paddingTop: 1, paddingBottom: 3
                        }}>
                            <Text style={[{ color: theme.textUnchangeable }, Typography.medium13_18]}>
                                {'Beta'}
                            </Text>
                        </View>
                    </View>
                    <Text style={{
                        fontSize: 14, color: theme.textSecondary,
                        marginTop: 2
                    }}>
                        {t('products.staking.pools.liquidDescription')}
                    </Text>
                </View>
            )}
            <Pressable
                onPress={() => {
                    navigation.navigate(props.isLedger ? 'LedgerLiquidStaking' : 'LiquidStaking')
                }}
                style={({ pressed }) => [{
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.backgroundPrimary,
                    padding: 16,
                    paddingTop: balance > 0n ? 20 : 0,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20,
                }, props.style]}
            >
                {!props.hideCycle && (
                    <View style={[
                        {
                            flexShrink: 1,
                            alignItems: 'center',
                            alignSelf: 'flex-end',
                            borderRadius: 16,
                            overflow: 'hidden',
                            backgroundColor: theme.border,
                            maxWidth: 74, justifyContent: 'center',
                        },
                        balance > 0n
                            ? { position: 'relative', top: -10, right: -6 }
                            : { position: 'relative', top: 10, right: -6 }
                    ]}>
                        <Text style={[
                            { paddingHorizontal: 8, paddingVertical: 1, color: theme.textPrimary, flexShrink: 1 },
                            Typography.regular13_18
                        ]}>
                            <Countdown
                                hidePrefix
                                left={left}
                                textStyle={[{ color: theme.textPrimary, flex: 1, flexShrink: 1 }, Typography.regular13_18]}
                            />
                        </Text>
                    </View>
                )}
                <View style={{
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 46, height: 46,
                        borderRadius: 23,
                        borderWidth: 0,
                        marginRight: 12,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: props.iconBackgroundColor ?? theme.border
                    }}>
                        {!requireSource
                            ? (
                                <StakingIcon
                                    width={44}
                                    height={44}
                                />
                            )
                            : (
                                <WImage
                                    requireSource={requireSource}
                                    width={44}
                                    height={44}
                                    borderRadius={22}
                                    style={{ backgroundColor: props.iconBackgroundColor }}
                                />
                            )}
                    </View>
                    <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{
                            flexGrow: 1, flexShrink: 1,
                            marginRight: 12,
                        }}>
                            <Text
                                style={[{ color: theme.textPrimary, flexShrink: 1, marginBottom: 2 }, Typography.semiBold17_24]}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {name}
                            </Text>
                            <Text
                                style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                <Text style={{ flexShrink: 1 }}>
                                    {apyWithFee ?? sub}
                                </Text>
                            </Text>
                        </View>
                        {balance > 0n && (
                            <View>
                                <Text style={[{ color: theme.textPrimary, alignSelf: 'flex-end' }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        precision={3}
                                        value={balance}
                                        centFontStyle={{ opacity: 0.5 }}
                                    />
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {' TON'}
                                    </Text>
                                </Text>
                                <PriceComponent
                                    amount={balance}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 20
                                    }}
                                    theme={theme}
                                    textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
});