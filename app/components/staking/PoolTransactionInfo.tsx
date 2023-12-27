import React, { memo, useMemo } from "react"
import { View, Text, StyleProp, TextStyle, ViewStyle } from "react-native"
import { t } from "../../i18n/t";
import { PriceComponent } from "../PriceComponent";
import { ThemeType } from "../../engine/state/theme";
import { useNetwork, useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPoolState } from "../../engine/types";
import { fromNano, toNano } from "@ton/core";
import { ItemDivider } from "../ItemDivider";
import { AboutIconButton } from "../AboutIconButton";
import { formatInputAmount } from "../../utils/formatCurrency";
import { getNumberFormatSettings } from "react-native-localize";

const itemViewStyle = {
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-between', alignItems: 'center',
} as StyleProp<ViewStyle>;
const itemTitleTextStyle = (theme: ThemeType) => ({
    fontSize: 15,
    color: theme.textSecondary,
    fontWeight: '400',
    maxWidth: '80%'
}) as StyleProp<TextStyle>;
const itemValueTextStyle = (theme: ThemeType) => ({
    fontSize: 17,
    color: theme.textPrimary,
    fontWeight: '400'
}) as StyleProp<TextStyle>;

export const PoolTransactionInfo = memo(({ pool, fee }: { pool: StakingPoolState, fee?: bigint | null }) => {
    const { decimalSeparator } = getNumberFormatSettings();
    if (!pool) return null;
    const theme = useTheme();
    const network = useNetwork();
    const depositFee = pool.params.depositFee + pool.params.receiptPrice;
    const withdrawFee = pool.params.withdrawFee + pool.params.receiptPrice;
    const poolFee = pool.params.poolFee
        ? Number(toNano(fromNano(pool.params.poolFee))) / 100
        : undefined;
    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)).toFixed(3)
        }
    }, [apy, poolFee]);


    return (
        <View>
            <View style={{
                backgroundColor: theme.surfaceOnElevation,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginTop: 20
            }}>
                {!!apyWithFee && (
                    <>
                        <View style={{
                            flexDirection: 'row', width: '100%',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <Text style={itemTitleTextStyle(theme)}>
                                {t('products.staking.info.rateTitle')}
                            </Text>
                            <Text style={itemValueTextStyle(theme)}>
                                {`${apyWithFee}%`}
                            </Text>
                        </View>
                        <ItemDivider marginHorizontal={0} />
                    </>
                )}
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(theme)}>
                        {t('products.staking.info.frequencyTitle')}
                    </Text>
                    <Text style={itemValueTextStyle(theme)}>
                        {t('products.staking.info.frequency')}
                    </Text>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(theme)}>
                        {t('products.staking.info.minDeposit')}
                    </Text>
                    <Text style={itemValueTextStyle(theme)}>
                        {fromNano(
                            pool.params.minStake
                            + pool.params.depositFee
                            + pool.params.receiptPrice
                        ) + ' TON'}
                    </Text>
                </View>
            </View>
            <View style={{
                backgroundColor: theme.surfaceOnElevation,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginTop: 20
            }}>
                {!network.isTestnet && !!poolFee && (
                    <>
                        <View style={itemViewStyle}>
                            <Text style={itemTitleTextStyle(theme)}>
                                {t('products.staking.info.poolFeeTitle')}
                            </Text>
                            <Text style={itemValueTextStyle(theme)}>
                                {`${poolFee}%`}
                            </Text>
                        </View>
                        <ItemDivider marginHorizontal={0} />
                    </>
                )}
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(theme)}>
                        {t('products.staking.info.depositFee')}
                        <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                            <AboutIconButton
                                title={t('products.staking.info.depositFee')}
                                description={t('products.staking.info.depositFeeDescription', { amount: fromNano(depositFee) })}
                                style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                            />
                        </View>
                    </Text>
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={itemValueTextStyle(theme)}>
                            {fromNano(depositFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400' }}
                            theme={theme}
                        />
                    </View>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(theme)}>
                        {t('products.staking.info.withdrawRequestFee')}
                        <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                            <AboutIconButton
                                title={t('products.staking.info.withdrawRequestFee')}
                                description={t('products.staking.info.withdrawFeeDescription')}
                                style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                            />
                        </View>
                    </Text>
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={itemValueTextStyle(theme)}>
                            {fromNano(withdrawFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400' }}
                            theme={theme}
                        />
                    </View>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <View style={{ flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap' }}>
                        <Text style={itemTitleTextStyle(theme)}>
                            {t('products.staking.info.withdrawCompleteFee')}
                            <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                <AboutIconButton
                                    title={t('products.staking.info.withdrawCompleteFee')}
                                    description={t('products.staking.info.withdrawCompleteDescription')}
                                    style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                />
                            </View>
                        </Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={itemValueTextStyle(theme)}>
                            {fromNano(withdrawFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400' }}
                            theme={theme}
                        />
                    </View>
                </View>
                {!!fee && (
                    <>
                        <ItemDivider marginHorizontal={0} />
                        <View style={itemViewStyle}>
                            <Text style={itemTitleTextStyle(theme)}>
                                {t('products.staking.info.blockchainFee')}
                            </Text>
                            <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                <Text style={itemValueTextStyle(theme)}>
                                    {`${fromNano(fee).replace('.', decimalSeparator)} TON`}
                                </Text>
                                <PriceComponent
                                    amount={fee}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: theme.textSecondary, fontWeight: '400' }}
                                    theme={theme}
                                />
                            </View>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
});