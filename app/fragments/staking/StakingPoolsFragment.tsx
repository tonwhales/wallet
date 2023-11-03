import React, { useCallback, useMemo } from "react";
import { Platform, View, Text, ScrollView, TouchableNativeFeedback, ActivityIndicator, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { KnownPools } from "../../utils/KnownPools";
import { ProductButton } from "../wallet/products/ProductButton";
import StakingIcon from '../../../assets/ic_staking.svg';
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from "expo-blur";
import { t } from "../../i18n/t";
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton } from "@react-navigation/elements";
import { Address, fromNano, toNano } from "@ton/core";
import BN from "bn.js";
import { ItemHeader } from "../../components/ItemHeader";
import { openWithInApp } from "../../utils/openWithInApp";
import { useTheme } from '../../engine/hooks';
import { TopBar } from "../../components/topbar/TopBar";
import { useStaking } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useStakingPool } from '../../engine/hooks';
import { useStakingApy } from '../../engine/hooks';

export type StakingPoolType = 'club' | 'team' | 'nominators' | 'epn' | 'lockup' | 'tonkeeper';

export function filterPools(pools: { address: Address, balance: bigint }[], type: StakingPoolType, processed: Set<string>, isTestnet: boolean) {
    return pools.filter((v) => KnownPools(isTestnet)[v.address.toString({ testOnly: isTestnet })].name.toLowerCase().includes(type) && !processed.has(v.address.toString({ testOnly: isTestnet })));
}

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
    balance: bigint,
    restricted?: boolean,
}) {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const addr = props.address.toString({ testOnly: isTestnet });
    const pool = useStakingPool(props.address);
    const poolFee = pool?.params.poolFee ? Number(toNano(fromNano(pool.params.poolFee)) / 100n) : undefined;
    const knownPools = KnownPools(isTestnet);
    const name = knownPools[addr].name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : addr.slice(0, 10) + '...' + addr.slice(addr.length - 6);
    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('products.staking.info.poolFeeTitle')} ${poolFee}%` + ` (${t('common.apy')} ~${(apy - apy * (poolFee / 100)).toFixed(2)}%)`;
        }
    }, [apy, poolFee]);

    let requireSource = knownPools[addr].requireSource;
    let club: boolean | undefined;
    if (
        addr === 'EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB'
        || addr === 'EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB'
    ) {
        club = true;
    }

    return (
        <>
            <ProductButton
                key={props.address.toString({ testOnly: isTestnet })}
                name={name}
                subtitle={apyWithFee ?? sub}
                icon={requireSource ? undefined : StakingIcon}
                requireSource={requireSource}
                value={props.balance > 0n ? props.balance : ''}
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
    const theme = useTheme();
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
                            fontSize: 14, color: theme.textSecondary
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
                                fontSize: 14, color: theme.textColor,
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
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const staking = useStaking();
    const pools = staking.pools;
    const poolsWithStake = pools.filter((v) => v.balance > 0n);
    const items: React.ReactElement[] = [];
    const processed = new Set<string>();

    const onJoinClub = useCallback(() => openWithInApp(isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club'), []);
    const onJoinTeam = useCallback(() => openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1'), []);
    const onEPNMore = useCallback(() => openWithInApp('https://epn.bz/'), []);


    // Await config
    if (!staking.config) {
        return (
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                <TopBar title={t('products.staking.title')} showBack />
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
                    key={`active-${p.address.toString({ testOnly: isTestnet })}`}
                    address={p.address}
                    balance={p.balance}
                />
            );
            processed.add(p.address.toString({ testOnly: isTestnet }));
        }
    }

    // Recommended
    let recommended = pools.find((v) => v.address.equals(Address.parse(staking.config!.recommended)));

    if (recommended && !processed.has(recommended.address.toString({ testOnly: isTestnet }))) {
        items.push(
            <Header
                key={'best-header'}
                text={t('products.staking.pools.best')}
            />
        );
        items.push(
            <PoolComponent
                key={`best-${recommended.address.toString({ testOnly: isTestnet })}`}
                address={recommended.address}
                balance={recommended.balance}
            />
        );
    }

    let club = filterPools(pools, 'club', processed, isTestnet);
    let team = filterPools(pools, 'team', processed, isTestnet);
    let nominators = filterPools(pools, 'nominators', processed, isTestnet);
    let epn = filterPools(pools, 'epn', processed, isTestnet);
    let lockups = filterPools(pools, 'lockup', processed, isTestnet);
    let tonkeeper = filterPools(pools, 'tonkeeper', processed, isTestnet);

    if (epn.length > 0) {
        items.push(
            <Header
                key={'epn-header'}
                text={t('products.staking.pools.epnPartners')}
                description={t('products.staking.pools.epnPartnersDescription')}
                action={{
                    title: t('products.staking.pools.moreAboutEPN'),
                    onAction: onEPNMore
                }}
            />
        );
        for (let pool of epn) {
            items.push(
                <PoolComponent
                    key={`epn-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                />
            );
        }
    }

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
                    key={`nominators-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
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
                    key={`club-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                />
            );
        }
    }

    if (lockups.length > 0) {
        items.push(
            <Header
                key={'lockups-header'}
                text={t('products.staking.pools.lockups')}
                description={t('products.staking.pools.lockupsDescription')}
            />
        );
        for (let pool of lockups) {
            items.push(
                <PoolComponent
                    key={`lockup-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
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
                    key={`team-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                />
            );
        }
    }

    if (tonkeeper.length > 0) {
        items.push(
            <Header
                key={'tonkeeper-header'}
                text={t('products.staking.pools.tonkeeper')}
                description={t('products.staking.pools.tonkeeperDescription')}
            />
        );
        for (let pool of tonkeeper) {
            items.push(
                <PoolComponent
                    key={`tonkeeper-${pool.address.toString({ testOnly: isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                />
            );
        }
    }

    return (
        <View style={{ flexGrow: 1, flex: 1 }}>
            <TopBar title={t('products.staking.title')} showBack />
            <ScrollView
                alwaysBounceVertical={false}
                style={{
                    flexShrink: 1,
                    flexGrow: 1,
                    backgroundColor: theme.background,
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