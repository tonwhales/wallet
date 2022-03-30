import React from "react"
import { View, Text } from "react-native"
import { TouchableHighlight } from "react-native-gesture-handler"
import { Theme } from "../../Theme"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import OldWalletIcon from '../../../assets/ic_old_wallet.svg';
import { ValueComponent } from "../ValueComponent"
import { useTranslation } from "react-i18next"
import BN from "bn.js"
import { Address } from "ton"
import { StakingPoolState } from "../../storage/cache"
import { Countdown } from "../Countdown"

export const StakingProductMember = React.memo((
    {
        member,
        pool
    }: {
        member: {
            address: Address,
            balance: BN,
            pendingDeposit: BN,
            pendingWithdraw: BN,
            withdraw: BN
        },
        pool: StakingPoolState
    }
) => {
    const navigation = useTypedNavigation();
    const { t } = useTranslation();


    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('Staking')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: 'white',
                marginHorizontal: 16, marginVertical: 4
            }}
        >
            <View style={{
                paddingVertical: 10,
                paddingLeft: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', marginRight: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <OldWalletIcon width={29} height={29} color={'white'} />
                        </View>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column' }}>
                        {member.balance.gtn(0) ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                                <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                                    {t("products.staking.balanceTitle")}
                                </Text>
                                <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                                    <ValueComponent
                                        value={member.balance}
                                        centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                        centLength={3}
                                    />
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                                <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                                    {t("products.staking.title")}
                                </Text>
                            </View>
                        )}
                        <View style={{ flexBasis: 0, flexGrow: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, width: '100%' }}>
                            <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0 }} ellipsizeMode="tail" numberOfLines={1}>
                                {t('products.staking.nextSycle')}
                            </Text>
                            <Countdown until={pool.stakeUntil} />
                        </View>
                    </View>
                </View>
                {(member.pendingDeposit.gtn(0) || member.withdraw.gtn(0) || member.pendingWithdraw.gtn(0)) && (
                    <>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8, marginLeft: 52 }} />
                        <View style={{
                            flexDirection: 'column', alignItems: 'baseline',
                            flexGrow: 1, flexBasis: 0
                        }}>
                            {member.pendingDeposit.gtn(0) && (
                                <View style={{
                                    flexDirection: 'row', justifyContent: 'space-between',
                                    alignItems: 'flex-end', width: '100%',
                                    paddingRight: 10
                                }}>
                                    <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0 }} ellipsizeMode="tail" numberOfLines={1}>
                                        {t('products.staking.pending.deposit')}
                                    </Text>
                                    <Text style={{ color: Theme.scoreGold, fontWeight: '600', fontSize: 16, }}>
                                        <ValueComponent
                                            value={member.pendingDeposit}
                                            centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                            centLength={3}
                                        />
                                    </Text>
                                </View>
                            )}
                            {member.withdraw.gtn(0) && (
                                <>
                                    {member.pendingDeposit.gtn(0) && (
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8, marginLeft: 8 }} />
                                    )}
                                    <View style={{
                                        flexDirection: 'row', justifyContent: 'space-between',
                                        alignItems: 'flex-end', width: '100%',
                                        marginTop: member.pendingDeposit.gtn(0) ? 4 : undefined,
                                        paddingRight: 10
                                    }}>
                                        <Text
                                            style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0 }}
                                            ellipsizeMode="tail"
                                            numberOfLines={1}
                                        >
                                            {t('products.staking.withdrawStatus.ready')}
                                        </Text>
                                        <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 16, }}>
                                            <ValueComponent
                                                value={member.withdraw}
                                                centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                                centLength={3}
                                            />
                                        </Text>
                                    </View>
                                </>
                            )}
                            {member.pendingWithdraw.gtn(0) && (
                                <>
                                    {(member.pendingDeposit.gtn(0) || member.withdraw.gtn(0)) && (
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8, marginLeft: 8 }} />
                                    )}
                                    <View style={{
                                        flexDirection: 'row', justifyContent: 'space-between',
                                        alignItems: 'flex-end', width: '100%',
                                        marginTop: (member.pendingDeposit.gtn(0) || member.pendingWithdraw.gtn(0)) ? 4 : undefined,
                                        paddingRight: 10
                                    }}>
                                        <Text
                                            style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0 }}
                                            ellipsizeMode="tail"
                                            numberOfLines={1}
                                        >
                                            {t('products.staking.withdrawStatus.pending')}
                                        </Text>
                                        <Text style={{ color: Theme.scoreGold, fontWeight: '600', fontSize: 16 }}>
                                            <ValueComponent
                                                value={member.pendingWithdraw}
                                                centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                                centLength={3}
                                            />
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </>
                )}
            </View>
        </TouchableHighlight>
    )
})