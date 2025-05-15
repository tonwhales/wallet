import React, { memo, useMemo } from "react";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { Address, Builder, beginCell, fromNano, toNano } from "@ton/core";
import { useLiquidStakingMember, useNetwork, useTheme } from "../../engine/hooks";
import { useLiquidStaking } from "../../engine/hooks/staking/useLiquidStaking";
import { Typography } from "../styles";
import { LiquidPendingWithdraw } from "./LiquidPendingWithdraw";
import { getLiquidStakingAddress } from "../../utils/KnownPools";
import { storeLiquidCollect } from "../../utils/LiquidStakingContract";

export const LiquidStakingPendingComponent = memo((
    {
        member,
        style,
        isLedger
    }: {
        member: Address,
        style?: StyleProp<ViewStyle>,
        isLedger?: boolean
    }
) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const liquidStaking = useLiquidStaking().data;
    const nominator = useLiquidStakingMember(member)?.data;

    const { pending, ready } = useMemo(() => {
        const pendingTemp = [];
        const readyTemp = [];

        const pending = nominator?.pendingWithdrawals;

        if (!!pending && !!liquidStaking) {
            for (const key of Object.keys(pending)) {
                const numKey = parseInt(key);
                const amount = pending[numKey] ?? '0';

                if (numKey + 3 <= liquidStaking.roundId) {
                    readyTemp.push(BigInt(amount));
                } else {
                    let readyRound = numKey + 2;
                    let timeForCurrentRoundEnd = liquidStaking.extras.roundEnd;
                    const roundDuration = network.isTestnet ? 2 * 60 * 60 : 18.6 * 60 * 60;

                    pendingTemp.push({
                        amount: BigInt(amount),
                        pendingUntil: (readyRound - liquidStaking.roundId) * roundDuration + timeForCurrentRoundEnd
                    });
                }
            }
        }

        return { pending: pendingTemp, ready: readyTemp };
    }, [nominator, network.isTestnet, liquidStaking?.extras.roundEnd, liquidStaking?.roundId]);

    if (pending.length === 0 && ready.length === 0) {
        return null;
    }

    return (
        <View style={[{ gap: 16 }, style]}>
            {pending.length > 0 && (
                <View
                    style={{
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20,
                        justifyContent: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 10
                    }}
                >
                    {pending.map((item, index) => {
                        return (
                            <LiquidPendingWithdraw
                                key={`liquid-pending-withdraw-${index}`}
                                pendingUntil={item.pendingUntil}
                                amount={BigInt(item.amount)}
                                last={index === pending.length - 1}
                            />
                        );
                    })}
                </View>
            )}
            {ready.length > 0 && (
                <Pressable
                    style={({ pressed }) => ({
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        opacity: pressed ? 0.5 : 1
                    })}
                    onPress={() => {
                        const amount = liquidStaking ? (liquidStaking.extras.withdrawFee + liquidStaking.extras.receiptPrice) : toNano('0.2');
                        const target = getLiquidStakingAddress(network.isTestnet).toString({ testOnly: network.isTestnet });

                        if (isLedger) {
                            navigation.navigateLedgerSignTransfer({
                                order: {
                                    type: 'ledger',
                                    target,
                                    payload: {
                                        type: 'comment',
                                        text: 'Collect',
                                    },
                                    amount,
                                    amountAll: false,
                                    stateInit: null,
                                },
                                text: t('products.staking.transfer.withdrawStakeTitle'),
                            });

                            return;
                        }

                        let payloadBuilder: Builder = beginCell();
                        payloadBuilder.store(storeLiquidCollect(0n, member))

                        navigation.navigateTransfer({
                            order: {
                                type: 'order',
                                messages: [{
                                    target,
                                    payload: payloadBuilder.endCell(),
                                    amount,
                                    amountAll: false,
                                    stateInit: null,
                                }]
                            },
                            text: null,
                            callback: null
                        });
                    }}
                >
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
                                {parseFloat(parseFloat(fromNano(ready.reduce((s, c) => s + c, 0n))).toFixed(3))}
                                <Text style={{ color: theme.textSecondary }}>
                                    {' TON'}
                                </Text>
                            </Text>
                            <PriceComponent
                                amount={ready.reduce((s, c) => s + c, 0n)}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                theme={theme}
                            />
                        </View>
                    </View>
                </Pressable>
            )}
        </View>
    );
})