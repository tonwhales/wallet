import React, { useCallback, useMemo } from "react";
import { Platform, View, Text, ScrollView, TouchableNativeFeedback, ActivityIndicator, ImageRequireSource, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { Engine, useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { KnownPools } from "../../utils/KnownPools";
import { ProductButton } from "../wallet/products/ProductButton";
import StakingIcon from '../../../assets/ic_staking.svg';
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from "expo-blur";
import { Theme } from "../../Theme";
import { t } from "../../i18n/t";
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton } from "@react-navigation/elements";
import { Address, fromNano, toNano } from "ton";
import BN from "bn.js";
import { ItemHeader } from "../../components/ItemHeader";
import { openWithInApp } from "../../utils/openWithInApp";

function clubAlert(navigation: TypedNavigation, pool: string) {
    Alert.alert(
        t('products.staking.pools.restrictedTitle'),
        t('products.staking.pools.restrictedMessage'),
        [
            {
                text: t('common.continue'),
                onPress: () => { navigation.navigate('Staking', { backToHome: true, pool }); }
            },
            {
                text: t('products.staking.pools.viewClub'),
                onPress: () => { openWithInApp('https://tonwhales.com/club'); },
            },
            { text: t('common.cancel'), onPress: () => { }, style: "cancel" }
        ]
    );
}

function restrictedAlert(navigation: TypedNavigation, pool: string) {
    Alert.alert(
        t('products.staking.transfer.restrictedTitle'),
        t('products.staking.transfer.restrictedMessage'),
        [
            {
                text: t('common.continue'),
                onPress: () => { navigation.navigate('Staking', { backToHome: true, pool }); }
            },
            {
                text: t('products.staking.moreInfo'),
                onPress: () => { openWithInApp('https://tonwhales.com/staking'); },
            },
            { text: t('common.cancel'), onPress: () => { }, style: "cancel" }
        ]
    );
}

function PoolComponent(props: {
    address: Address,
    balance: BN,
    restricted?: boolean,
    engine: Engine
}) {
    const navigation = useTypedNavigation();
    const addr = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    const pool = props.engine.products.whalesStakingPools.usePool(props.address);
    const poolFee = pool?.params.poolFee ? toNano(fromNano(pool.params.poolFee)).divn(100).toNumber() : undefined;
    const name = KnownPools[addr].name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : addr.slice(0, 10) + '...' + addr.slice(addr.length - 6);
    const apy = props.engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('products.staking.info.poolFeeTitle')} ${poolFee}%` + ` (${t('common.apy')} ~${(apy - apy * (poolFee / 100)).toFixed(2)}%)`;
        }
    }, [apy, poolFee]);

    let requireSource: ImageRequireSource | undefined;
    let club: boolean | undefined;
    let team: boolean | undefined;
    // TODO refactor this
    if (addr === 'EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB') {
        requireSource = require('../../../assets/ic_club_cosmos.png');
        club = true;
    }
    if (addr === 'EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB') {
        requireSource = require('../../../assets/ic_club_robot.png');
        club = true;
    }
    if (addr === 'EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM') {
        requireSource = require('../../../assets/known/ic_team_1.png');
        team = true;
    }
    if (addr === 'EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM') {
        requireSource = require('../../../assets/known/ic_team_2.png');
        team = true;
    }
    if (addr === 'EQBYtJtQzU3M-AI23gFM91tW6kYlblVtjej59gS8P3uJ_ePN') {
        requireSource = require('../../../assets/known/ic_epn_1.png');
        team = true;
    }
    if (addr === 'EQCpCjQigwF27KQ588VhQv9jm_DUuL_ZLY3HCf_9yZW5_ePN') {
        requireSource = require('../../../assets/known/ic_epn_2.png');
        team = true;
    }

    return (
        <>
            <ProductButton
                key={props.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                name={name}
                subtitle={apyWithFee ?? sub}
                icon={requireSource ? undefined : StakingIcon}
                requireSource={requireSource}
                value={props.balance.gt(new BN(0)) ? props.balance : ''}
                onPress={() => {
                    if (club && props.restricted) {
                        clubAlert(navigation, addr);
                        return;
                    } else if (props.restricted) {
                        restrictedAlert(navigation, addr);
                        return;
                    }
                    navigation.navigate('Staking', { backToHome: false, pool: addr })
                }}
                style={{ marginVertical: 4 }}
            />
        </>
    );
}

function Header(props: {
    text: string,
    description?: string,
    action?: { title: string, onAction: () => void }
}) {
    return (
        <View style={{ marginBottom: 10 }}>
            <ItemHeader title={props.text} style={{ paddingVertical: undefined, marginTop: 11, height: undefined }} />
            {(props.description || props.action) && (
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16
                }}>
                    {!!props.description && (
                        <Text style={{
                            maxWidth: '70%',
                            fontSize: 14, color: Theme.textSecondary
                        }}>
                            {props.description}
                        </Text>
                    )}
                    {!!props.action && (
                        <Pressable style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                                alignSelf: 'flex-end',
                                flexShrink: 1
                            }
                        }}
                            onPress={props.action.onAction}
                        >
                            <Text style={{
                                fontSize: 14, color: Theme.textColor,
                                textDecorationLine: 'underline',
                                textAlign: 'right'
                            }}>
                                {props.action.title}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}
        </View>
    )
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

    const onJoinClub = useCallback(
        () => {
            openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club');
        },
        [],
    );

    const onJoinTeam = useCallback(
        () => {
            openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1');
        },
        [],
    );


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
        items.push(
            <Header
                key={'active-header'}
                text={t('products.staking.pools.active')}
            />
        );
        for (let p of poolsWithStake) {
            items.push(
                <PoolComponent
                    key={`active-${p.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={p.address}
                    balance={p.balance}
                    engine={engine}
                />
            );
            processed.add(p.address.toFriendly({ testOnly: AppConfig.isTestnet }));
        }
    }

    // Recommended
    let recommended = pools.find((v) => v.address.equals(Address.parse(staking.config!.recommended)));

    if (recommended && !processed.has(recommended.address.toFriendly({ testOnly: AppConfig.isTestnet }))) {
        items.push(
            <Header
                key={'best-header'}
                text={t('products.staking.pools.best')}
            />
        );
        items.push(
            <PoolComponent
                key={`best-${recommended.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                address={recommended.address}
                balance={recommended.balance}
                engine={engine}
            />
        );
    }

    let available = useMemo(() => {
        return pools.filter((v) => !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })) && !!staking.config!.pools.find((v2) => Address.parse(v2).equals(v.address)))
    }, [processed]);

    let club = pools.filter((v) => KnownPools[v.address.toFriendly({ testOnly: AppConfig.isTestnet })].name.toLowerCase().includes('club') && !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })));
    let team = pools.filter((v) => KnownPools[v.address.toFriendly({ testOnly: AppConfig.isTestnet })].name.toLowerCase().includes('team') && !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })));
    let nominators = pools.filter((v) => KnownPools[v.address.toFriendly({ testOnly: AppConfig.isTestnet })].name.toLowerCase().includes('nominators') && !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })));
    let epn = pools.filter((v) => KnownPools[v.address.toFriendly({ testOnly: AppConfig.isTestnet })].name.toLowerCase().includes('epn') && !processed.has(v.address.toFriendly({ testOnly: AppConfig.isTestnet })));

    if (nominators.length > 0) {
        items.push(
            <Header
                key={'nomanators-header'}
                text={t('products.staking.pools.nominators')}
                description={t('products.staking.pools.nominatorsDescription')}
            />
        );
        for (let pool of nominators) {
            items.push(
                <PoolComponent
                    key={`nominators-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                />
            );
        }
    }

    if (club.length > 0) {
        items.push(
            <Header
                key={'club-header'}
                text={t('products.staking.pools.club')}
                description={t('products.staking.pools.clubDescription')}
                action={{
                    title: t('products.staking.pools.joinClub'),
                    onAction: onJoinClub
                }}
            />
        );
        for (let pool of club) {
            items.push(
                <PoolComponent
                    key={`club-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                />
            );
        }
    }

    if (team.length > 0) {
        items.push(
            <Header
                key={'team-header'}
                text={t('products.staking.pools.team')}
                description={t('products.staking.pools.teamDescription')}
                action={{
                    title: t('products.staking.pools.joinTeam'),
                    onAction: onJoinTeam
                }}
            />
        );
        for (let pool of team) {
            items.push(
                <PoolComponent
                    key={`team-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                />
            );
        }
    }

    if (epn.length > 0) {
        items.push(
            <Header
                key={'epn-header'}
                text={t('products.staking.pools.partners')}
            />
        );
        for (let pool of epn) {
            items.push(
                <PoolComponent
                    key={`epn-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                />
            );
        }
    }

    return (
        <View style={{ flexGrow: 1, flex: 1 }}>
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
                style={{
                    flexShrink: 1,
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                }}
                contentContainerStyle={{
                    paddingTop: 8
                }}
            >
                <View style={{ flexGrow: 1 }}>

                    {items}
                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
            <View style={{ height: safeArea.bottom }} />
        </View>
    );
});