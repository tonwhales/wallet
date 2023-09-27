import BN from "bn.js";
import React, { memo } from "react";
import { View, Text, StyleProp, ViewStyle, Pressable, Image } from "react-native";
import { Address, fromNano, toNano } from "ton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { TransferAction } from "../../fragments/staking/StakingTransferFragment";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";

export const StakingPendingComponent = memo((
    {
        member,
        target,
        style
    }: {
        member?: {
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        } | null,
        target: Address,
        style?: StyleProp<ViewStyle>
    }
) => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();

    member = {
        balance: toNano('233434'),
        pendingDeposit: toNano('233434'),
        pendingWithdraw: toNano('233434'),
        withdraw: toNano('233434'),
    }

    if (
        !member
        || (
            member.pendingDeposit.eqn(0)
            && member.pendingWithdraw.eqn(0)
            && member.withdraw.eqn(0)
        )
    ) {
        return null;
    }

    return (
        <View style={[{
            backgroundColor: Theme.border,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            paddingBottom: 0,
            marginBottom: 16
        }, style]}>
            {member.pendingDeposit.gtn(0) && (
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 20
                }}>
                    <View>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: Theme.textPrimary
                        }}>
                            {t('products.staking.actions.deposit')}
                        </Text>
                        <Text style={{
                            fontSize: 15,
                            fontWeight: '400',
                            color: Theme.textSecondary
                        }}>
                            {t('products.staking.pending')}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: Theme.textPrimary
                        }}>
                            {parseFloat(parseFloat(fromNano(member.pendingDeposit)).toFixed(3)) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={member.pendingDeposit}
                            style={{
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: Theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                        />
                    </View>
                </View>)}
            {member.pendingWithdraw.gtn(0) && (
                <>
                    {member.pendingDeposit.gtn(0) && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: Theme.divider,
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
                                color: Theme.textPrimary
                            }}>
                                {t('products.staking.actions.withdraw')}
                            </Text>
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '400',
                                color: Theme.textSecondary
                            }}>
                                {t('products.staking.pending')}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: Theme.textPrimary
                            }}>
                                {parseFloat(parseFloat(fromNano(member.pendingWithdraw)).toFixed(3)) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={member.pendingWithdraw}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: Theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                            />
                        </View>
                    </View>
                </>
            )}

            {member.withdraw.gtn(0) && (
                <>
                    {(member.pendingWithdraw.gtn(0) || member.pendingDeposit.gtn(0)) && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: Theme.divider,
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
                                    color: Theme.textPrimary, marginBottom: 2
                                }}>
                                    {t('products.staking.withdrawStatus.ready')}
                                </Text>
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '500',
                                    color: Theme.accent
                                }}>
                                    {t('products.staking.withdrawStatus.withdrawNow')}
                                </Text>
                            </View>
                            <View>
                                <Text style={{
                                    fontSize: 17,
                                    fontWeight: '600',
                                    color: Theme.textPrimary,
                                    marginBottom: 2
                                }}>
                                    {parseFloat(parseFloat(fromNano(member.withdraw)).toFixed(3)) + ' ' + 'TON'}
                                </Text>
                                <PriceComponent
                                    amount={member.withdraw}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        paddingVertical: 0,
                                        height: 'auto',
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: Theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                                />
                            </View>
                        </View>
                    </Pressable>
                </>
            )}
        </View>
    );
})