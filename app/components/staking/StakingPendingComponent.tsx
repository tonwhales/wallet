import React, { memo, useCallback } from "react";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { TransferAction } from "../../fragments/staking/StakingTransferFragment";
import { t } from "../../i18n/t";
import { Address, fromNano } from "@ton/core";
import { StakingPoolMember } from "../../engine/types";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { useKnownPools } from "../../utils/KnownPools";

export const StakingPendingComponent = memo((
    {
        member,
        target,
        style,
        isLedger,
        isTestnet,
        showTitle,
        routeToPool
    }: {
        member?: StakingPoolMember | null,
        target: Address,
        style?: StyleProp<ViewStyle>,
        isLedger?: boolean,
        isTestnet: boolean,
        showTitle?: boolean,
        routeToPool?: boolean
    }
) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const knownPools = useKnownPools(isTestnet);
    const name = knownPools[target.toString({ testOnly: isTestnet })]?.name;

    const navigateToPool = useCallback(() => {
        navigation.navigateStakingPool(
            { pool: target.toString({ testOnly: isTestnet }), backToHome: false },
            { ledger: isLedger }
        );
    }, [target, isTestnet, isLedger]);

    if (
        !member
        || (
            member.pendingDeposit === 0n
            && member.pendingWithdraw === 0n
            && member.withdraw === 0n
        )
    ) {
        return null;
    }

    return (
        <View style={[{
            backgroundColor: theme.surfaceOnBg,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            paddingBottom: 0,
            marginBottom: 16
        }, style]}>
            {showTitle && (
                <View style={{ alignSelf: 'flex-start' }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {name}
                    </Text>
                </View>
            )}
            {member.pendingDeposit > 0n && (
                <Pressable onPress={routeToPool ? navigateToPool : undefined} style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 20
                }}>
                    <View>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            {t('products.staking.actions.deposit')}
                        </Text>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('products.staking.pending')}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            {parseFloat(parseFloat(fromNano(member.pendingDeposit)).toFixed(3)) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={member.pendingDeposit}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                            theme={theme}
                        />
                    </View>
                </Pressable>)}
            {member.pendingWithdraw > 0n && (
                <>
                    {member.pendingDeposit > 0n && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: theme.divider,
                            marginBottom: 20
                        }} />
                    )}
                    <Pressable onPress={routeToPool ? navigateToPool : undefined} style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <View>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {t('products.staking.actions.withdraw')}
                            </Text>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('products.staking.actions.withdraw')}
                            </Text>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('products.staking.pending')}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {parseFloat(parseFloat(fromNano(member.pendingWithdraw)).toFixed(3)) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={member.pendingWithdraw}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                                theme={theme}
                            />
                        </View>
                    </Pressable>
                </>
            )}

            {member.withdraw > 0n && (
                <>
                    {(member.pendingWithdraw > 0n || member.pendingDeposit > 0n) && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: theme.divider,
                            marginBottom: 20
                        }} />
                    )}
                    <Pressable
                        style={{ width: '100%', marginBottom: 20 }}
                        onPress={() => {
                            navigation.navigateStakingTransfer(
                                {
                                    target: target.toString({ testOnly: isTestnet }),
                                    amount: member.withdraw.toString(),
                                    lockAmount: true,
                                    lockAddress: true,
                                    lockComment: true,
                                    action: 'withdraw_ready' as TransferAction
                                },
                                { ledger: isLedger }
                            );
                        }}
                    >
                        <View style={{
                            flexDirection: 'row', width: '100%',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <View>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {t('products.staking.withdrawStatus.ready')}
                                </Text>
                                <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                                    {t('products.staking.withdrawStatus.withdrawNow')}
                                </Text>
                            </View>
                            <View>
                                <Text style={[{ color: theme.textPrimary, marginBottom: 2 }, Typography.semiBold17_24]}>
                                    {parseFloat(parseFloat(fromNano(member.withdraw)).toFixed(3)) + ' ' + 'TON'}
                                </Text>
                                <PriceComponent
                                    amount={member.withdraw}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        paddingVertical: 0,
                                        height: 'auto',
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                                    theme={theme}
                                />
                            </View>
                        </View>
                    </Pressable>
                </>
            )}
        </View>
    );
})