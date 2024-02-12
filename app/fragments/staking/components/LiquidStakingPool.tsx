import { memo, useEffect, useMemo, useState } from "react";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { KnownPools, getLiquidStakingAddress } from "../../../utils/KnownPools";
import { t } from "../../../i18n/t";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import { WImage } from "../../../components/WImage";
import { ValueComponent } from "../../../components/ValueComponent";
import { PriceComponent } from "../../../components/PriceComponent";
import { Countdown } from "../../../components/Countdown";
import { Address, fromNano, toNano } from "@ton/core";
import { useLiquidStakingMember, useNetwork, useStakingApy, useTheme } from "../../../engine/hooks";
import { useLiquidStaking } from "../../../engine/hooks/staking/useLiquidStaking";

import StakingIcon from '@assets/ic_staking.svg';
import { Typography } from "../../../components/styles";
import { ItemHeader } from "../../../components/ItemHeader";

export const LiquidStakingPool = memo((
    props: {
        member: Address,
        restricted?: boolean,
        style?: StyleProp<ViewStyle>,
        hideCycle?: boolean,
        isLedger?: boolean
    }
) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const liquidAddress = getLiquidStakingAddress(network.isTestnet);
    const poolAddressString = liquidAddress.toString({ testOnly: network.isTestnet });
    const liquidStaking = useLiquidStaking().data;
    const nominator = useLiquidStakingMember(props.member)?.data;
    const apy = useStakingApy()?.apy;

    const balance = useMemo(() => {
        return nominator?.data.balance ?? 0n;
    }, [nominator]);

    const poolFee = liquidStaking?.extras.poolFee ? Number(toNano(fromNano(liquidStaking?.extras.poolFee))) / 100 : undefined;
    const knownPools = KnownPools(network.isTestnet);
    const requireSource = knownPools[poolAddressString]?.requireSource;
    const stakeUntil = Math.min(liquidStaking?.extras.proxyZeroStakeUntil ?? 0, liquidStaking?.extras.proxyOneStakeUntil ?? 0);
    const name = knownPools[poolAddressString]?.name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : poolAddressString.slice(0, 10) + '...' + poolAddressString.slice(poolAddressString.length - 6);
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(apy - apy * (poolFee / 100)).toFixed(2)}%`;
        }
    }, [apy, poolFee]);


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
        <>
            <View style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 16
            }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <ItemHeader
                        title={t('products.staking.pools.liquid')}
                        style={{ flexShrink: 1 }}
                    />
                </View>
                <Text style={{
                    maxWidth: '90%',
                    fontSize: 14, color: theme.textSecondary,
                    marginTop: 2
                }}>
                    {t('products.staking.pools.liquidDescription')}
                </Text>
            </View>
            <View style={{
                backgroundColor: theme.backgroundPrimary,
                marginHorizontal: 4, marginBottom: 4,
                borderRadius: 20
            }}>
                <Pressable
                    onPress={() => {
                        navigation.navigate(props.isLedger ? 'LedgerLiquidStaking' : 'LiquidStaking')
                    }}
                    style={({ pressed }) => [{
                        flex: 1,
                        opacity: pressed ? 0.5 : 1,
                        borderRadius: 16,
                        backgroundColor: theme.backgroundPrimary,
                        padding: 16,
                        paddingTop: balance > 0n ? 20 : 0,
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
                            marginRight: 10,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: theme.border,
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
                                        heigh={44}
                                        borderRadius={22}
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
        </>
    );
});