import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Image, Text, Alert } from "react-native";
import { useLiquidUSDeStakingMember, useLiquidUSDeStakingRate, useNetwork, useTheme } from "../../engine/hooks";
import { ValueComponent } from "../ValueComponent";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";
import { ItemDivider } from "../ItemDivider";
import { t } from "../../i18n/t";
import { Address, toNano } from "@ton/ton";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { LiquidPendingWithdraw } from "./LiquidPendingWithdraw";
import { useUSDeAssetsShares } from "../../engine/hooks";
import { createWithdrawLiquidUSDeStakingPayload } from "../../utils/staking/liquidUSDeStaking";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Pressable } from "react-native-gesture-handler";

export const LiquidUSDeStakingMember = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const nominator = useLiquidUSDeStakingMember(address);
    const usdeShares = useUSDeAssetsShares(address);
    const rate = useLiquidUSDeStakingRate();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();

    const decimals = usdeShares?.tsUsdeHint?.jetton.decimals ?? 6;

    const tsUsdeWallet = useMemo(() => {
        if (!usdeShares) {
            return;
        }
        return usdeShares.tsUsdeHint?.walletAddress;
    }, [usdeShares]);

    const { balance, balanceInUsde } = useMemo(() => {
        const bal = fromBnWithDecimals(nominator?.balance || 0n, 6);
        return {
            balance: toNano(bal),
            balanceInUsde: toNano((Number(bal) * rate).toFixed(6))
        };
    }, [nominator, rate]);

    const lockedBalance = nominator?.timeLocked?.balance || 0n;
    const limit = nominator?.timeLocked?.limit;

    const stakeUntil = useMemo(() => {
        try {
            if (limit) {
                return Number(limit);
            }
        } catch { }
        return 0;
    }, [limit]);

    const ready = Date.now() >= (stakeUntil * 1000);
    const [isWithdrawReady, setIsWithdrawReady] = useState(ready);

    useEffect(() => {
        setIsWithdrawReady(ready);
    }, [ready]);

    const onWithdraw = useCallback(() => {
        if (!tsUsdeWallet) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (lockedBalance === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        const transferCell = createWithdrawLiquidUSDeStakingPayload({
            owner: address,
            amount: lockedBalance,
            isTestnet
        });

        const transferAmountTon = toNano('0.2');

        navigation.navigateTransfer({
            order: {
                type: 'order',
                messages: [{
                    target: tsUsdeWallet.address,
                    payload: transferCell,
                    amount: transferAmountTon,
                    amountAll: false,
                    stateInit: null
                }]
            },
            text: null
        });
    }, [lockedBalance, tsUsdeWallet, isTestnet]);

    return (
        <View>
            {(lockedBalance > 0n && stakeUntil !== 0) && (
                <Pressable
                    style={({ pressed }) => [
                        {
                            borderRadius: 20,
                            backgroundColor: theme.surfaceOnBg,
                            padding: 20,
                            marginBottom: 16
                        },
                        (pressed && isWithdrawReady) && { opacity: 0.5 }
                    ]}
                    disabled={!isWithdrawReady}
                    onPress={onWithdraw}
                >
                    {!isWithdrawReady ? (
                        <LiquidPendingWithdraw
                            pendingUntil={stakeUntil}
                            amount={lockedBalance}
                            symbol={' USDe'}
                            decimals={6}
                            priceUSD={1}
                            last
                            onTimeOut={() => setIsWithdrawReady(true)}
                        />
                    ) : (
                        <View style={{
                            flexDirection: 'row', width: '100%',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <View>
                                <Text style={[{ color: theme.accentGreen }, Typography.semiBold17_24]}>
                                    {t('products.staking.withdrawStatus.ready')}
                                </Text>
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    {t('products.staking.withdraw')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {fromBnWithDecimals(lockedBalance, decimals)}
                                    <Text style={{ color: theme.textSecondary }}>
                                        {' USDe'}
                                    </Text>
                                </Text>
                                <PriceComponent
                                    amount={toNano(fromBnWithDecimals(lockedBalance, decimals))}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        paddingVertical: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                    theme={theme}
                                    priceUSD={1}
                                />
                            </View>
                        </View>
                    )}
                </Pressable>
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
                                amount={balanceInUsde}
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
                            value={toNano(rate)}
                            precision={2}
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