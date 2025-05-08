import { memo, useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { KnownPools } from "../../utils/KnownPools";
import { t } from "../../i18n/t";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import { WImage } from "../WImage";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Address, toNano } from "@ton/core";
import { useIsLedgerRoute, useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useNetwork, useTheme, useUSDeStakingApy } from "../../engine/hooks";
import { Typography } from "../styles";
import { ItemHeader } from "../ItemHeader";
import { gettsUSDeMinter } from "../../secure/KnownWallets";
import { fromBnWithDecimals } from "../../utils/withDecimals";

import StakingIcon from '@assets/ic_staking.svg';

export const LiquidUSDeStakingPool = memo((
    props: {
        member: Address,
        restricted?: boolean,
        style?: StyleProp<ViewStyle>
        hideHeader?: boolean,
        iconBackgroundColor?: string
    }
) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const minterAddress = gettsUSDeMinter(isTestnet);
    const poolAddressString = minterAddress.toString({ testOnly: isTestnet });
    const nominator = useLiquidUSDeStakingMember(props.member);
    const usdeApy = useUSDeStakingApy()?.apy;
    const rate = useLiquidUSDeStakingRate();
    const isLedger = useIsLedgerRoute();

    const balance = useMemo(() => {
        const bal = fromBnWithDecimals(nominator?.balance || 0n, 6);
        return toNano(bal);
    }, [nominator]);

    const inUsde = balance * rate;

    const apyWithFee = useMemo(() => {
        if (!!usdeApy) {
            return `${t('common.apy')} ≈ ${usdeApy.toFixed(2)}%`;
        }
    }, [usdeApy]);
    const knownPools = KnownPools(isTestnet);
    const requireSource = knownPools[poolAddressString]?.requireSource;
    const name = knownPools[poolAddressString]?.name;
    const sub = poolAddressString.slice(0, 10) + '...' + poolAddressString.slice(poolAddressString.length - 6);

    const navigate = () => {
        navigation.navigate(isLedger ? 'LedgerLiquidUSDeStaking' : 'LiquidUSDeStaking');
    };

    return (
        <View style={[{ borderRadius: 20 }, props.style]}>
            {!props.hideHeader && (
                <View style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                }}>
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ItemHeader
                            title={t('products.staking.pools.liquidUsde')}
                            style={{ flexShrink: 1 }}
                            textStyle={{ flexGrow: 0 }}
                        />
                    </View>
                    <Text style={{
                        fontSize: 14, color: theme.textSecondary,
                        marginTop: 2
                    }}>
                        {t('products.staking.pools.liquidUsdeDescription')}
                    </Text>
                </View>
            )}
            <Pressable
                onPress={navigate}
                style={({ pressed }) => [{
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.backgroundPrimary,
                    padding: 16,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20,
                }, props.style]}
            >
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
                                        precision={2}
                                        value={balance}
                                        centFontStyle={{ opacity: 0.5 }}
                                    />
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {' tsUSDe'}
                                    </Text>
                                </Text>
                                <PriceComponent
                                    amount={inUsde}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 20
                                    }}
                                    theme={theme}
                                    textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                    priceUSD={1}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
});

LiquidUSDeStakingPool.displayName = 'LiquidUSDeStakingPool';