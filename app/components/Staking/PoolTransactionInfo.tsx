import BN from "bn.js";
import React, { useMemo } from "react"
import { View, Text, StyleProp, TextStyle, ViewStyle } from "react-native"
import { fromNano, toNano } from "ton";
import { t } from "../../i18n/t";
import { StakingPoolState } from "../../engine/sync/startStakingPoolSync";
import { PriceComponent } from "../PriceComponent";
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ItemDivider } from "../ItemDivider";
import { ThemeType } from "../../utils/Theme";
import { AboutIconButton } from "../AboutIconButton";

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

export const PoolTransactionInfo = React.memo(({ pool, fee }: { pool: StakingPoolState, fee?: BN | null }) => {
    if (!pool) return null;
    const { Theme, AppConfig } = useAppConfig();
    const depositFee = pool.params.depositFee.add(pool.params.receiptPrice);
    const withdrawFee = pool.params.withdrawFee.add(pool.params.receiptPrice);
    const poolFee = pool.params.poolFee ? toNano(fromNano(pool.params.poolFee)).divn(100).toNumber() : undefined;
    const engine = useEngine();
    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return (apy - apy * (poolFee / 100)).toFixed(3)
        }
    }, [apy, poolFee]);


    return (
        <View>
            <View style={{
                backgroundColor: Theme.surfaceSecondary,
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
                            <Text style={itemTitleTextStyle(Theme)}>
                                {t('products.staking.info.rateTitle')}
                            </Text>
                            <Text style={itemValueTextStyle(Theme)}>
                                {`${apyWithFee}%`}
                            </Text>
                        </View>
                        <ItemDivider marginHorizontal={0} />
                    </>
                )}
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.info.frequencyTitle')}
                    </Text>
                    <Text style={itemValueTextStyle(Theme)}>
                        {t('products.staking.info.frequency')}
                    </Text>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.info.minDeposit')}
                    </Text>
                    <Text style={itemValueTextStyle(Theme)}>
                        {fromNano(
                            pool.params.minStake
                                .add(pool.params.depositFee)
                                .add(pool.params.receiptPrice)
                        ) + ' TON'}
                    </Text>
                </View>
            </View>
            <View style={{
                backgroundColor: Theme.surfaceSecondary,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                marginTop: 20
            }}>
                {!AppConfig.isTestnet && !!poolFee && (
                    <>
                        <View style={itemViewStyle}>
                            <Text style={itemTitleTextStyle(Theme)}>
                                {t('products.staking.info.poolFeeTitle')}
                            </Text>
                            <Text style={itemValueTextStyle(Theme)}>
                                {`${poolFee}%`}
                            </Text>
                        </View>
                        <ItemDivider marginHorizontal={0} />
                    </>
                )}
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(Theme)}>
                        {t('products.staking.info.depositFee')}
                        <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                            <AboutIconButton
                                title={t('products.staking.info.depositFee')}
                                description={t('products.staking.info.depositFeeDescription')}
                                style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                            />
                        </View>
                    </Text>
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={itemValueTextStyle(Theme)}>
                            {fromNano(depositFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <Text style={itemTitleTextStyle(Theme)}>
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
                        <Text style={itemValueTextStyle(Theme)}>
                            {fromNano(withdrawFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
                <ItemDivider marginHorizontal={0} />
                <View style={itemViewStyle}>
                    <View style={{ flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap' }}>
                        <Text style={itemTitleTextStyle(Theme)}>
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
                        <Text style={itemValueTextStyle(Theme)}>
                            {fromNano(withdrawFee) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={depositFee}
                            style={{
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end',
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400' }}
                        />
                    </View>
                </View>
                {!!fee && (
                    <>
                        <ItemDivider marginHorizontal={0} />
                        <View style={itemViewStyle}>
                            <Text style={itemTitleTextStyle(Theme)}>
                                {t('products.staking.info.blockchainFee')}
                            </Text>
                            <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                <Text style={itemValueTextStyle(Theme)}>
                                    {fee ? fromNano(fee) + ' ' + 'TON' : '...'}
                                </Text>
                                {fee && (
                                    <PriceComponent
                                        amount={fee}
                                        style={{
                                            backgroundColor: Theme.transparent,
                                            paddingHorizontal: 0,
                                            alignSelf: 'flex-end'
                                        }}
                                        textStyle={{ color: Theme.textSecondary, fontWeight: '400' }}
                                    />
                                )}
                            </View>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
});