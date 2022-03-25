import BN from "bn.js";
import React, { useCallback } from "react"
import { View, Text, Platform, Image, Alert } from "react-native"
import { Address, fromNano, toNano } from "ton";
import { Theme } from "../../Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { getCurrentAddress } from "../../storage/appState";
import { ValueComponent } from "../ValueComponent";
import { AppConfig } from "../../AppConfig";
import { TouchableHighlight } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { StakingPoolState } from "../../storage/cache";
import { useAccount } from "../../sync/Engine";
import { capitalizeString } from "../../utils/capitalizeString";
import Img_whale from '../../../assets/images/img_whale.svg';

export const StakingMemberComponent = React.memo((props: {
    member: {
        address: Address,
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    },
    pool: StakingPoolState
}) => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

    const onUnstake = useCallback(
        () => {
            Alert.alert(
                t('products.staking.unstake.title'),
                t('products.staking.unstake.message'),
                [
                    {
                        text: capitalizeString(t('products.staking.actions.withdraw')),
                        style: 'destructive',
                        onPress: () => {
                            navigation.navigate(
                                'Transfer',
                                {
                                    target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    comment: 'Withdraw',
                                    amount: toNano('0.2'),
                                    lockAmount: true,
                                    lockAddress: true,
                                    lockComment: true,
                                    staking: {
                                        goBack: true,
                                        minAmount: toNano('0.2'),
                                        action: 'withdraw'
                                    }
                                }
                            )
                        }
                    },
                    { text: t('common.cancel') }
                ]
            );
        },
        [],
    );

    return (
        <View style={{ flexGrow: 1 }}>
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        textAlign: 'center', fontWeight: '600',
                        fontSize: 17
                    }]}>
                        {t('products.staking.title')}
                    </Text>
                </View>
            )}
            <View
                style={{ marginHorizontal: 16, marginTop: 12, paddingBottom: 12, padding: 12 }}
                collapsable={false}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                        borderRadius: 14
                    }}
                />
                <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: Theme.accent,
                    alignItems: 'center', justifyContent: 'center',
                    alignSelf: 'center'
                }}>
                    <Img_whale width={Math.floor(64 * 0.7)} height={Math.floor(64 * 0.7)} color="white" />
                </View>
                <Text style={[{
                    textAlign: 'center', fontWeight: '600',
                    fontSize: 17, marginTop: 8
                }]}>
                    {props.pool.name}
                </Text>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 32,
                    alignItems: 'center'
                }}>
                    <View style={{
                        flexDirection: 'column',
                    }}>
                        <Text
                            style={{ fontSize: 14, color: Theme.textSecondary }}
                        >
                            {t('products.staking.balance')}
                        </Text>
                        <Text
                            style={{ fontSize: 30, color: Theme.textColor, fontWeight: '800', height: 40 }}
                        >
                            <ValueComponent
                                value={props.member.balance}
                                centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                        {(price && !AppConfig.isTestnet) && (
                            <View style={[{
                                backgroundColor: Theme.accent,
                                borderRadius: 9,
                                height: 24,
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                alignSelf: 'flex-start',
                                paddingVertical: 4, paddingHorizontal: 8
                            }]}>
                                <Text style={{
                                    color: 'white',
                                    fontSize: 14, fontWeight: '600',
                                    textAlign: "center",
                                    lineHeight: 16
                                }}>
                                    {`$ ${(parseFloat(fromNano(props.member.balance)) * price.price.usd)
                                        .toFixed(2)
                                        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`
                                    }
                                </Text>
                            </View>
                        )}
                        {props.member.balance.gtn(0) && (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, width: '100%', marginRight: 10 }}>
                                <Text style={{ color: '#8E979D', fontSize: 13 }} ellipsizeMode="tail">
                                    {t("products.staking.subtitle.rewards") + ': ~'}
                                </Text>
                                <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 16, marginLeft: 4 }}>
                                    <ValueComponent
                                        value={props.member.balance.muln(0.133)}
                                        centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                        centLength={3}
                                    />
                                    {(price && !AppConfig.isTestnet) && ` ($ ${(parseFloat(fromNano(props.member.balance.muln(0.133))) * price.price.usd)
                                        .toFixed(2)
                                        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')})`
                                    }
                                </Text>
                            </View>
                        )}
                    </View>
                    {props.member.balance.gtn(0) && (
                        <TouchableHighlight
                            onPress={onUnstake}
                            underlayColor={Theme.selector}
                            style={{
                                borderRadius: 34,
                                backgroundColor: Theme.secondaryButton,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 13, color: '#FF0000' }}>
                                {t('products.staking.actions.withdraw').toUpperCase()}
                            </Text>
                        </TouchableHighlight>
                    )}
                </View>
                {props.member.pendingDeposit.gtn(0) && (
                    <View style={{ flexDirection: 'column' }}>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                        <View style={{ justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: 14, color: Theme.textSecondary }}>
                                {t('products.staking.pending.deposit')}
                            </Text>
                            <Text style={{ fontSize: 30, color: Theme.scoreGold, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                                <ValueComponent
                                    value={props.member.pendingDeposit}
                                    centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                                    centLength={3}
                                />
                            </Text>
                        </View>
                    </View>
                )}
                {props.member.pendingWithdraw.gtn(0) && (
                    <View style={{ flexDirection: 'column' }}>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                        <View style={{ justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: 14, color: Theme.textSecondary }}>
                                {t('products.staking.withdrawStatus.pending')}
                            </Text>
                            <Text style={{ fontSize: 30, color: Theme.scoreGold, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                                <ValueComponent
                                    value={props.member.pendingWithdraw}
                                    centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                                    centLength={3}
                                />
                            </Text>
                        </View>
                    </View>
                )}
                {props.member.withdraw.gtn(0) && (
                    <View style={{ flexDirection: 'column' }}>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <View style={{ justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>
                                    {t('products.staking.withdrawStatus.ready')}
                                </Text>
                                <Text style={{ fontSize: 30, color: '#4FAE42', fontWeight: '800', marginTop: 2, }} numberOfLines={1}>
                                    <ValueComponent
                                        value={props.member.withdraw}
                                        centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                                        centLength={3}
                                    />
                                </Text>
                            </View>
                            <TouchableHighlight
                                onPress={onUnstake}
                                underlayColor={Theme.selector}
                                style={{
                                    borderRadius: 34,
                                    backgroundColor: Theme.secondaryButton,
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#4FAE42' }}>
                                    {t('products.staking.actions.withdraw').toUpperCase()}
                                </Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                )}
            </View>
            <View style={{ flex: 1, flexGrow: 1 }} />
            {/* actions */}
            <View style={{ flexDirection: 'row', marginHorizontal: 16, paddingBottom: safeArea.bottom + 16 }} collapsable={false}>
                <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                    <TouchableHighlight
                        onPress={() => navigation.navigate(
                            'Transfer',
                            {
                                target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                comment: 'Deposit',
                                amount: props.pool.minStake.addn(0.2),
                                lockAddress: true,
                                lockComment: true,
                                staking: {
                                    goBack: true,
                                    minAmount: props.pool.minStake.addn(0.2),
                                    action: 'deposit'
                                }
                            }
                        )}
                        underlayColor={Theme.selector}
                        style={{ borderRadius: 14 }}
                    >
                        <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                            <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Image source={require('../../../assets/ic_receive.png')} />
                            </View>
                            <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('products.staking.actions.deposit')}</Text>
                        </View>
                    </TouchableHighlight>
                </View>
            </View>
        </View >
    );
});