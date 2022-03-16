import BN from "bn.js";
import React, { useEffect } from "react"
import { View, Text, Platform, Image } from "react-native"
import { Address, fromNano, toNano } from "ton";
import { Transaction } from "../../sync/Transaction";
import { formatDate, getDateKey } from "../../utils/dates";
import { TransactionView } from "../TransactionView";
import { Theme } from "../../Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { getCurrentAddress } from "../../storage/appState";
import { useAccount } from "../../sync/Engine";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { AppConfig } from "../../AppConfig";
import { TouchableHighlight } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { StakingPoolState } from "../../storage/cache";
import { CloseButton } from "../CloseButton";
import LottieView from 'lottie-react-native';

const StakingTransactions = React.memo((props: { txs: Transaction[], address: Address, onPress: (tx: Transaction) => void }) => {
    const transactionsSectioned = React.useMemo(() => {
        let sections: { title: string, items: Transaction[] }[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].time);
            let lastSection: Transaction[] = [];
            let title = formatDate(props.txs[0].time);
            sections.push({ title, items: lastSection });
            for (let t of props.txs) {
                let time = getDateKey(t.time);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(t.time);
                    sections.push({ title, items: lastSection });
                }
                lastSection.push(t);
            }
        }
        return sections;
    }, [props.txs]);

    const components: any[] = [];
    for (let s of transactionsSectioned) {
        components.push(
            <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                <Text style={{ fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
            </View>
        );
        components.push(
            < View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }
            } collapsable={false} >
                {s.items.map((t, i) => <TransactionView own={props.address} tx={t} separator={i < s.items.length - 1} key={'tx-' + t.id} onPress={props.onPress} />)}
            </View >
        );
    }

    return <>{components}</>;
})

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
    const animRef = React.useRef<LottieView>(null);

    useEffect(() => {
        setTimeout(() => {
            if (Platform.OS) {
                animRef.current?.play();
            }
        }, 300);
    }, [animRef.current]);

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
                            t('stake.title')}</Text>
                </View>
            )}
            <View
                style={[{ marginHorizontal: 16, marginTop: 48, }]}
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
                    style={{ fontSize: 14, color: 'black', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                >
                    {t('stake.balanceTitle')}
                </Text>
                <Text
                    style={{ fontSize: 30, color: 'black', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}
                >
                    <ValueComponent
                        value={props.member.balance}
                        centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                    />
                </Text>
                <PriceComponent style={{ marginHorizontal: 22, marginTop: 6 }} />
            </View>
            {parseFloat(fromNano(props.member.pendingDeposit)) > 0 && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: Theme.scoreGold, fontWeight: '500' }}>{t('stake.pending.deposit')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingDeposit}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                </View>
            )}
            {parseFloat(fromNano(props.member.pendingWithdraw)) > 0 && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: Theme.scoreGold, fontWeight: '500' }}>{t('stake.withdrawStatus.pending')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.pendingWithdraw}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                </View>
            )}
            {parseFloat(fromNano(props.member.withdraw)) > 0 && (
                <View style={{ flexDirection: 'column', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 14 }} collapsable={false}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#4FAE42', fontWeight: '500' }}>{t('stake.withdrawStatus.ready')}</Text>
                        <Text style={{ fontSize: 12, color: 'black', fontWeight: '800', marginTop: 2, }} numberOfLines={1}>
                            <ValueComponent
                                value={props.member.withdraw}
                                centFontStyle={{ fontSize: 10, fontWeight: '500', opacity: 0.55 }}
                            />
                        </Text>
                    </View>
                </View>
            )}
            <View style={{ flex: 1, flexGrow: 1 }} />
            {/* staking_whale */}
            <View style={{ alignSelf: 'center' }}>
                <LottieView
                    ref={animRef}
                    source={require('../../../assets/animations/staking_whale.json')}
                    autoPlay={true}
                    loop={true}
                    style={{ width: 140, height: 140 }}
                />
            </View>
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
                                minAmount: props.pool.minStake,
                                staking: {
                                    goBack: true,
                                    minAmount: props.pool.minStake,
                                    deposit: true
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
                            <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('stake.actions.deposit')}</Text>
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
                                staking: {
                                    goBack: true,
                                    minAmount: toNano('0.2')
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
                            <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('stake.actions.withdraw')}</Text>
                        </View>
                    </TouchableHighlight>
                </View>
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});