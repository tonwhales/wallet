import React from "react"
import { View, Text } from "react-native"
import { TouchableHighlight } from "react-native"
import { Theme } from "../../Theme"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import StakingIcon from '../../../assets/ic_staking.svg';
import BN from "bn.js"
import { PriceComponent } from "../PriceComponent"
import { ValueComponent } from "../ValueComponent"
import { t } from "../../i18n/t"
import { StakingPoolState } from "../../engine/sync/StakingPoolSync"

export const StakingProductMember = React.memo((
    {
        member,
        pool
    }: {
        member: {
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        },
        pool: StakingPoolState
    }
) => {
    const navigation = useTypedNavigation();

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('Staking')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: Theme.item,
                marginHorizontal: 16, marginVertical: 4
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: Theme.success, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <StakingIcon width={42} height={42} color={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'column',
                        flexGrow: 1,
                        paddingVertical: 2,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 3
                        }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: member.balance && member.balance.gt(new BN(0))
                                    ? '#4FAE42'
                                    : Theme.textColor
                            }}>
                                <ValueComponent
                                    value={member.balance}
                                    precision={3}
                                />
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ color: '#787F83', fontSize: 13, fontWeight: '400' }} ellipsizeMode="tail">
                                {t("products.staking.subtitle.joined")}
                            </Text>
                            <PriceComponent
                                amount={member.balance}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: 14
                                }}
                                textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    )
})