import BN from "bn.js";
import React, { memo } from "react";
import { View, Text, StyleProp, ViewStyle, Pressable, Image } from "react-native";
import { Address, fromNano } from "ton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import Img_Widthdraw_ready_action from '@assets/ic_withdraw_ready_unstake.svg';
import ForwardIcon from '@assets/ic_chevron_forward.svg'
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

    if (!member) return null;
    if (
        member.pendingDeposit.eqn(0)
        && member.pendingWithdraw.eqn(0)
        && member.withdraw.eqn(0)
    ) return null;

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
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textSecondary
                    }}>
                        {t('products.staking.pending.deposit')}
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
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
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400' }} />
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
                        <Text style={{
                            fontSize: 16,
                            color: Theme.textSecondary
                        }}>
                            {t('products.staking.pending.withdraw')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
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
                                textStyle={{ color: Theme.textSecondary, fontWeight: '400' }} />
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
                    <View style={{
                        width: '100%',
                        marginBottom: 20

                    }}>
                        <View style={{
                            flexDirection: 'row', width: '100%',
                            justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <Text style={{
                                fontSize: 16,
                                color: Theme.textSecondary
                            }}>
                                {t('products.staking.withdrawStatus.ready')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    color: Theme.accentGreen
                                }}>
                                    {parseFloat(parseFloat(fromNano(member.withdraw)).toFixed(3)) + ' ' + 'TON'}
                                </Text>
                                <PriceComponent
                                    amount={member.withdraw}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{ color: Theme.textSecondary, fontWeight: '400' }} />
                            </View>
                        </View>
                        <Pressable
                            style={(props) => ({
                                opacity: props.pressed ? 0.5 : 1,
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: Theme.accent,
                                borderRadius: 32,
                                paddingHorizontal: 10, paddingVertical: 8,
                                marginTop: 16
                            })}
                            onPress={() => navigation.navigateStaking({
                                target: target,
                                amount: member.withdraw,
                                lockAmount: true,
                                lockAddress: true,
                                lockComment: true,
                                action: 'withdraw_ready' as TransferAction,
                            })}
                        >
                            <View style={{ width: '100%', flexShrink: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                <Image
                                    style={{
                                        height: 16,
                                        width: 16,
                                    }}
                                    source={require('@assets/ic_receive.png')}
                                />
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: Theme.textPrimary,
                                        fontWeight: '500',
                                        textAlignVertical: 'center',
                                        marginLeft: 10,
                                        lineHeight: 24,
                                    }}
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                >
                                    {t('products.staking.withdrawStatus.withdrawNow')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
})