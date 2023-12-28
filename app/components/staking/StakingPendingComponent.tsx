import React, { memo } from "react";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { TransferAction } from "../../fragments/staking/StakingTransferFragment";
import { t } from "../../i18n/t";
import { Address, fromNano } from "@ton/core";
import { StakingPoolMember } from "../../engine/types";
import { useTheme } from "../../engine/hooks";

export const StakingPendingComponent = memo((
    {
        member,
        target,
        style
    }: {
        member?: StakingPoolMember | null,
        target: Address,
        style?: StyleProp<ViewStyle>
    }
) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

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
            backgroundColor: theme.border,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            paddingBottom: 0,
            marginBottom: 16
        }, style]}>
            {member.pendingDeposit > 0n && (
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 20
                }}>
                    <View>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: theme.textPrimary
                        }}>
                            {t('products.staking.actions.deposit')}
                        </Text>
                        <Text style={{
                            fontSize: 15,
                            fontWeight: '400',
                            color: theme.textSecondary
                        }}>
                            {t('products.staking.pending')}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: theme.textPrimary
                        }}>
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
                </View>)}
            {member.pendingWithdraw > 0n && (
                <>
                    {member.pendingDeposit > 0n && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: theme.divider,
                            marginBottom: 20
                        }} />
                    )}
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <View>

                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: theme.textPrimary
                            }}>
                                {t('products.staking.actions.withdraw')}
                            </Text>
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '400',
                                color: theme.textSecondary
                            }}>
                                {t('products.staking.pending')}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: theme.textPrimary
                            }}>
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
                    </View>
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
                        onPress={() => navigation.navigateStaking({
                            target: target,
                            amount: member.withdraw,
                            lockAmount: true,
                            lockAddress: true,
                            lockComment: true,
                            action: 'withdraw_ready' as TransferAction,
                        })}
                    >
                        <View style={{
                            flexDirection: 'row', width: '100%',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <View>
                                <Text style={{
                                    fontSize: 17,
                                    fontWeight: '600',
                                    color: theme.textPrimary, marginBottom: 2
                                }}>
                                    {t('products.staking.withdrawStatus.ready')}
                                </Text>
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '500',
                                    color: theme.accent
                                }}>
                                    {t('products.staking.withdrawStatus.withdrawNow')}
                                </Text>
                            </View>
                            <View>
                                <Text style={{
                                    fontSize: 17,
                                    fontWeight: '600',
                                    color: theme.textPrimary,
                                    marginBottom: 2
                                }}>
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