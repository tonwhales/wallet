import { memo, useMemo } from "react";
import { View, Image, Text } from "react-native";
import { useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useTheme } from "../../engine/hooks";
import { ValueComponent } from "../ValueComponent";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";
import { ItemDivider } from "../ItemDivider";
import { t } from "../../i18n/t";
import { Address, fromNano, toNano } from "@ton/ton";
import { fromBnWithDecimals, toBnWithDecimals } from "../../utils/withDecimals";
import { StakingCycle } from "./StakingCycle";
import { LiquidStakingPoolTimer } from "./LiquidStakingPool";
import { LiquidPendingWithdraw } from "./LiquidPendingWithdraw";

export const LiquidUSDeStakingMember = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const nominator = useLiquidUSDeStakingMember(address);
    const rate = useLiquidUSDeStakingRate();

    const balance = useMemo(() => {
        const bal = fromBnWithDecimals(nominator?.balance || 0n, 6);
        return toNano(bal);
    }, [nominator]);

    const inUsde = useMemo(() => {
        return balance * rate;
    }, [balance, rate]);

    const lockedBalance = useMemo(() => {
        return nominator?.timeLocked?.balance || 0n;
    }, [nominator?.timeLocked?.balance]);

    const stakeUntil = useMemo(() => {
        try {
            if (nominator?.timeLocked?.limit) {
                // plus a week
                return Number(nominator?.timeLocked?.limit) + (7 * 24 * 60 * 60);
            }
        } catch { }
        return 0;
    }, [nominator?.timeLocked?.limit]);

    return (
        <View>
            {lockedBalance > 0n && (
                <View style={{
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnBg,
                    padding: 20,
                    marginBottom: 16
                }}>
                    <LiquidPendingWithdraw
                        pendingUntil={stakeUntil}
                        amount={lockedBalance}
                        symbol={' tsUSDe'}
                        decimals={6}
                        priceUSD={Number(rate * 1000n)}
                        last
                    />
                </View>
            )}
            <View style={{
                borderRadius: 20,
                backgroundColor: theme.surfaceOnBg,
                padding: 20,
                marginBottom: 16,
            }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{
                        height: 46, width: 46,
                        justifyContent: 'center', alignItems: 'center',
                        borderRadius: 23,
                        marginRight: 12
                    }}>
                        <Image
                            source={require('@assets/known/ic_usde.png')}
                            style={{
                                height: 46,
                                width: 46,
                            }}
                        />
                        <View style={[{
                            position: 'absolute',
                            justifyContent: 'center', alignItems: 'center',
                            bottom: -2, right: -2,
                            width: 20, height: 20, borderRadius: 20,
                            backgroundColor: theme.surfaceOnBg
                        }]}>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ width: 20, height: 20 }}
                            />
                        </View>
                    </View>
                    <View style={{ flexGrow: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {'tsUSDe'}
                            </Text>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                <ValueComponent
                                    value={balance}
                                    precision={4}
                                    centFontStyle={{ opacity: 0.5 }}
                                />
                                <Text style={{ color: theme.textSecondary }}>{' tsUSDe'}</Text>
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {'Staked USDe'}
                            </Text>
                            <PriceComponent
                                amount={inUsde}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined
                                }}
                                priceUSD={1}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                theme={theme}
                            />
                        </View>
                    </View>
                </View>
                <ItemDivider marginHorizontal={0} marginVertical={20} />
                <View style={{ backgroundColor: theme.backgroundPrimary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
                    <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                        {'1 USDe = '}
                        <ValueComponent
                            value={toBnWithDecimals(rate, 6)}
                            precision={6}
                            decimals={6}
                            suffix={' tsUSDe'}
                        />
                    </Text>
                </View>
                <Text style={[{ color: theme.textSecondary, marginTop: 4, paddingHorizontal: 16 }, Typography.regular15_20]}>
                    {t('products.staking.pools.liquidUsdeDescription')}
                </Text>
            </View>
        </View>
    );
});