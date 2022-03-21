import BN from "bn.js";
import React from "react"
import { View, Text, Platform, Image } from "react-native"
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
import { CloseButton } from "../CloseButton";
import { useAccount } from "../../sync/Engine";

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

    return (
        <View style={{ flexGrow: 1 }}>
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        textAlign: 'center', fontWeight: '600',
                        fontSize: 17
                    }]}>{
                            t('products.staking.title')}</Text>
                </View>
            )}
            <View
                style={{ marginHorizontal: 16, marginTop: 12, paddingBottom: 12, padding: 22 }}
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
                <Text
                    style={{ fontSize: 14, color: 'black', opacity: 0.8 }}
                >
                    {t('common.balance')}
                </Text>
                <Text
                    style={{ fontSize: 30, color: 'black', fontWeight: '800', height: 40 }}
                >
                    <ValueComponent
                        value={props.member.balance}
                        centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                    />
                </Text>
                {price && !AppConfig.isTestnet && (
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, width: '100%', marginRight: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13 }} ellipsizeMode="tail">
                            {t("products.staking.subtitle.rewards")}
                        </Text>
                        <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 16, }}>
                            <ValueComponent
                                value={props.member.balance.muln(0.133)}
                                centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                centLength={3}
                            />
                            {` ($ ${(parseFloat(fromNano(props.member.balance.muln(0.133))) * price.price.usd)
                                .toFixed(2)
                                .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')})`
                            }
                        </Text>
                    </View>
                )}
            </View>
            {props.member.pendingDeposit.gtn(0) && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: Theme.scoreGold, fontWeight: '500' }}>{t('products.staking.pending.deposit')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingDeposit}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                                centLength={3}
                            />
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, width: '100%', marginRight: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13 }} ellipsizeMode="tail">
                            {t("products.staking.subtitle.rewards")}
                        </Text>
                        <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 16, }}>
                            <ValueComponent
                                value={props.member.pendingDeposit.muln(0.133)}
                                centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                centLength={3}
                            />
                            {` ($ ${(parseFloat(fromNano(props.member.pendingDeposit.muln(0.133))) * price.price.usd)
                                .toFixed(2)
                                .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')})`
                            }
                        </Text>
                    </View>
                </View>
            )}
            {props.member.pendingWithdraw.gtn(0) && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: Theme.scoreGold, fontWeight: '500' }}>{t('products.staking.withdrawStatus.pending')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingWithdraw}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                                centLength={3}
                            />
                        </Text>
                    </View>
                </View>
            )}
            {props.member.withdraw.gtn(0) && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#4FAE42', fontWeight: '500' }}>{t('products.staking.withdrawStatus.ready')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2, }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.withdraw}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                                centLength={3}
                            />
                        </Text>
                    </View>
                </View>
            )}
            <View style={{ flex: 1, flexGrow: 1 }} />
            {/* actions */}
            <View style={{ flexDirection: 'row', marginHorizontal: 16, paddingBottom: safeArea.bottom + 16 }} collapsable={false}>
                <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                    <TouchableHighlight
                        onPress={() => navigation.navigate(
                            'Transfer',
                            {
                                target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                comment: 'Deposit',
                                amount: props.pool.minStake,
                                lockAddress: true,
                                lockComment: true,
                                staking: {
                                    goBack: true,
                                    minAmount: props.pool.minStake,
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
                <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: 'white', borderRadius: 14 }}>
                    <TouchableHighlight
                        onPress={() => navigation.navigate(
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
                        )}
                        underlayColor={Theme.selector}
                        style={{ borderRadius: 14 }}
                    >
                        <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                            <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Image source={require('../../../assets/ic_send.png')} />
                            </View>
                            <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('products.staking.actions.withdraw')}</Text>
                        </View>
                    </TouchableHighlight>
                </View>
            </View>
        </View>
    );
});