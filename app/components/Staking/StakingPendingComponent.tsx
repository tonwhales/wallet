import BN from "bn.js";
import React from "react";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";
import { fromNano } from "ton";
import { Theme } from "../../Theme";
import { PoolAddress } from "../../utils/PoolAddress";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import Img_Widthdraw_ready_action from '../../../assets/ic_withdraw_ready_unstake.svg';
import ForwardIcon from '../../../assets/ic_chevron_forward.svg'
import { createWithdrawStakeCell } from "../../utils/createWithdrawStakeCommand";
import { TransferAction } from "../../fragments/staking/StakingTransferFragment";
import { t } from "../../i18n/t";

export const StakingPendingComponent = React.memo((
    {
        member,
        params,
        style
    }: {
        member?: {
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        } | null,
        params?: {
            minStake: BN,
            depositFee: BN,
            withdrawFee: BN,
            receiptPrice: BN,
            stakeUntil: number,
        } | null,
        style?: StyleProp<ViewStyle>
    }
) => {
    const navigation = useTypedNavigation();

    if (!member) return null;
    if (
        member.pendingDeposit.eqn(0)
        && member.pendingWithdraw.eqn(0)
        && member.withdraw.eqn(0)
    ) return null;


    return (
        <View style={[{
            backgroundColor: 'white',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 16,
            marginBottom: 14
        }, style]}>
            {member.pendingDeposit.gtn(0) && (
                <View style={{
                    flexDirection: 'row', width: '100%',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingRight: 16,
                    height: 56
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#7D858A'
                    }}>
                        {t('products.staking.pending.deposit')}
                    </Text>
                    <View>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {parseFloat(parseFloat(fromNano(member.pendingDeposit)).toFixed(3)) + ' ' + 'TON'}
                        </Text>
                        <PriceComponent
                            amount={member.pendingDeposit}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                alignSelf: 'flex-end'
                            }}
                            textStyle={{ color: '#6D6D71', fontWeight: '400' }} />
                    </View>
                </View>)}
            {member.pendingWithdraw.gtn(0) && (
                <>
                    {member.pendingDeposit.gtn(0) && (
                        <View style={{
                            height: 1, width: '100%',
                            backgroundColor: Theme.divider,
                        }} />
                    )}
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A'
                        }}>
                            {t('products.staking.pending.withdraw')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {parseFloat(parseFloat(fromNano(member.pendingWithdraw)).toFixed(3)) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={member.pendingWithdraw}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }} />
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
                        }} />
                    )}
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: 16,
                        height: 56
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: '#7D858A'
                        }}>
                            {t('products.staking.withdrawStatus.ready')}
                        </Text>
                        <View>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}>
                                {parseFloat(parseFloat(fromNano(member.withdraw)).toFixed(3)) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={member.withdraw}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }} />
                        </View>
                    </View>
                    <View style={{
                        height: 1, width: '100%',
                        backgroundColor: Theme.divider,
                    }} />
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Pressable
                            style={(props) => ({ opacity: props.pressed ? 0.3 : 1, flexDirection: 'row', alignItems: 'center' })}
                            onPress={() => {
                                navigation.navigate(
                                    'StakingTransfer',
                                    {
                                        target: PoolAddress,
                                        comment: 'Withdraw',
                                        amount: member.withdraw,
                                        lockAmount: true,
                                        lockAddress: true,
                                        lockComment: true,
                                        payload: createWithdrawStakeCell(member.withdraw),
                                        action: 'withdraw_ready' as TransferAction,
                                    }
                                )

                            }}
                        >
                            <View style={{ height: 48, paddingLeft: 0, paddingRight: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexGrow: 1, flexBasis: 0 }}>
                                <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <Img_Widthdraw_ready_action />
                                    <View style={{
                                        flexDirection: 'row',
                                        flexGrow: 1,
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: Theme.textColor,
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
                                        <ForwardIcon />
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </View>
                </>
            )
            }
        </View >
    );
})