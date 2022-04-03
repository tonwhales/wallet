import BN from "bn.js";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { Address, fromNano } from "ton";
import { Theme } from "../../Theme";
import { PriceComponent } from "../PriceComponent";

export const StakingPendingComponent = React.memo((
    {
        member,
        style
    }: {
        member?: {
            address: Address,
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        },
        style?: StyleProp<ViewStyle>
    }
) => {

    if (!member) return null;
    if (member.pendingDeposit.eqn(0) && member.pendingWithdraw.eqn(0)) return null;

    const { t } = useTranslation();


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
                            fontWeight: '600',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            {fromNano(member.pendingDeposit) + ' ' + 'TON'}
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
                                fontWeight: '600',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {fromNano(member.pendingWithdraw) + ' ' + 'TON'}
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
        </View>
    );
})