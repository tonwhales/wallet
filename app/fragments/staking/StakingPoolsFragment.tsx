import React from "react";
import { Platform, View, Text, ScrollView, TouchableNativeFeedback, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { KnownPools } from "../../utils/KnownPools";
import { ProductButton } from "../wallet/products/ProductButton";
import StakingIcon from '../../../assets/ic_staking.svg';
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from "expo-blur";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton } from "@react-navigation/elements";
import { Address } from "ton";
import BN from "bn.js";
import { ItemHeader } from "../../components/ItemHeader";

function PoolComponent(props: { address: Address, balance: BN }) {
    const navigation = useTypedNavigation();
    const addr = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    const name = KnownPools[addr].name
    const sub = addr.slice(0, 10) + '...' + addr.slice(addr.length - 6)
    return (
        <ProductButton
            key={props.address.toFriendly({ testOnly: AppConfig.isTestnet })}
            name={name}
            subtitle={sub}
            icon={StakingIcon}
            value={props.balance}
            onPress={() => navigation.navigate('Staking', { backToHome: true, pool: addr })}
            style={{ marginVertical: 4 }}
        />
    );
}

function Header(props: { text: string }) {
    return <ItemHeader title={props.text} />
}

export const StakingPoolsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const staking = engine.products.whalesStakingPools.useStaking();
    const pools = staking.pools;
    const poolsWithStake = pools.filter((v) => v.balance.gtn(0));
    const items: React.ReactElement[] = [];
    const processed = new Set<string>();

    // Await config
    if (!staking.config) {
        return (
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                {Platform.OS === 'ios' && (
                    <BlurView style={{
                        height: safeArea.top + 44,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <HeaderBackButton
                                style={{
                                    position: 'absolute',
                                    left: 0, bottom: 0
                                }}
                                label={t('common.back')}
                                labelVisible
                                onPress={() => {
                                    navigation.goBack();
                                }}
                                tintColor={Theme.accent}
                            />
                            <Text style={[
                                { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                            ]}>
                                {t('products.staking.title')}
                            </Text>
                        </View>
                        <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: '#000',
                            opacity: 0.08
                        }} />
                    </BlurView>
                )}
                {Platform.OS === 'android' && (
                    <View style={{
                        height: safeArea.top + 44,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            position: 'absolute',
                            left: 16, bottom: 8
                        }}>
                            <TouchableNativeFeedback
                                onPress={() => {
                                    navigation.goBack();
                                }}
                                background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                            >
                                <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[
                                { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                            ]}>
                                {t('products.staking.title')}
                            </Text>
                        </View>
                        <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: '#000',
                            opacity: 0.08
                        }} />
                    </View>
                )}
                <View style={{ flexGrow: 1, flexBasis: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator />
                </View>
            </View>
        );
    }

    if (poolsWithStake.length > 0) {
        items.push(<Header key={'active-header'} text={'🚀 ' + t('products.staking.pools.active')} />);
        for (let p of poolsWithStake) {
            items.push(<PoolComponent key={p.address.toFriendly({ testOnly: AppConfig.isTestnet })} address={p.address} balance={p.balance} />);
            processed.add(p.address.toFriendly({ testOnly: AppConfig.isTestnet }));
        }
    }

    // Recommended
    let recommended = pools.find((v) => v.address.equals(Address.parse(staking.config!.recommended)));
    if (recommended && poolsWithStake.length === 0) {
        processed.add(recommended.address.toFriendly({ testOnly: AppConfig.isTestnet }));
        items.push(<Header key={'active-header'} text={'💎 ' + t('products.staking.pools.best')} />);
        items.push(<PoolComponent key={recommended.address.toFriendly({ testOnly: AppConfig.isTestnet })} address={recommended.address} balance={recommended.balance} />);
    }

    // Available
    let available = pools.filter((v) => !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })) && !!staking.config!.pools.find((v2) => Address.parse(v2).equals(v.address)));
    if (available.length > 0) {
        items.push(<Header key={'available-header'} text={'🤝 ' + t('products.staking.pools.alternatives')} />);
        for (let a of available) {
            processed.add(a.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            items.push(<PoolComponent key={a.address.toFriendly({ testOnly: AppConfig.isTestnet })} address={a.address} balance={a.balance} />);
        }
    }

    // Unavailable
    let unavailable = pools.filter((v) => !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })));
    if (unavailable.length > 0) {
        items.push(<Header key={'unavailable-header'} text={'🔐 ' + t('products.staking.pools.private')} />);
        for (let a of unavailable) {
            processed.add(a.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            items.push(<PoolComponent key={a.address.toFriendly({ testOnly: AppConfig.isTestnet })} address={a.address} balance={a.balance} />);
        }
    }

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            {Platform.OS === 'ios' && (
                <BlurView style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <HeaderBackButton
                            style={{
                                position: 'absolute',
                                left: 0, bottom: 0
                            }}
                            label={t('common.back')}
                            labelVisible
                            onPress={() => {
                                navigation.goBack();
                            }}
                            tintColor={Theme.accent}
                        />
                        <Text style={[
                            { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                        ]}>
                            {t('products.staking.title')}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </BlurView>
            )}
            {Platform.OS === 'android' && (
                <View style={{
                    height: safeArea.top + 44,
                    paddingTop: safeArea.top,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        position: 'absolute',
                        left: 16, bottom: 8
                    }}>
                        <TouchableNativeFeedback
                            onPress={() => {
                                navigation.goBack();
                            }}
                            background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                        >
                            <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                    <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[
                            { fontSize: 17, color: Theme.textColor, fontWeight: '600' },
                        ]}>
                            {t('products.staking.title')}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: Theme.background, opacity: 0.9, flexGrow: 1 }} />
                    <View style={{
                        position: 'absolute',
                        bottom: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: '#000',
                        opacity: 0.08
                    }} />
                </View>
            )}
            <ScrollView
                alwaysBounceVertical={false}
                contentContainerStyle={{ flexGrow: 1, flexBasis: 0, paddingTop: 8, paddingBottom: safeArea.bottom + 52 }}
                style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    backgroundColor: Theme.background,
                }}
            >
                {/* {pools.map((p) => {
                    const addr = p.address.toFriendly({ testOnly: AppConfig.isTestnet });
                    const name = KnownPools[addr].name
                    const sub = addr.slice(0, 10) + '...' + addr.slice(addr.length - 6)
                    return (
                        <ProductButton
                            key={p.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            name={name}
                            subtitle={sub}
                            icon={StakingIcon}
                            value={p.balance}
                            onPress={() => navigation.navigate('Staking', { backToHome: true, pool: addr })}
                            style={{ marginVertical: 4 }}
                        />
                    );
                })} */}
                {items}
            </ScrollView>
        </View>
    );
});