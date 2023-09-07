import React, { ReactElement, useCallback, useLayoutEffect, useMemo } from "react";
import { View, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { KnownPools } from "../../utils/KnownPools";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { Address } from "ton";
import BN from "bn.js";
import { openWithInApp } from "../../utils/openWithInApp";
import { useAppConfig } from "../../utils/AppConfigContext";
import { TopBar } from "../../components/topbar/TopBar";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";
import { StakingPoolsHeader } from "./components/StakingPoolsHeader";
import { StakingPool } from "./components/StakingPool";

export type StakingPoolType = 'club' | 'team' | 'nominators' | 'epn' | 'lockup' | 'tonkeeper';

export function filterPools(pools: { address: Address, balance: BN }[], type: StakingPoolType, processed: Set<string>, isTestnet: boolean) {
    return pools.filter((v) => KnownPools(isTestnet)[v.address.toFriendly({ testOnly: isTestnet })].name.toLowerCase().includes(type) && !processed.has(v.address.toFriendly({ testOnly: isTestnet })));
}

export const StakingPoolsFragment = fragment(() => {
    const { AppConfig, Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const isLedger = route.name === 'LedgerStakingPools';
    const engine = useEngine();

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch {
            return;
        }
    }, [ledgerContext?.addr?.address]);

    const stakingMain = engine.products.whalesStakingPools.useStakingCurrent();
    const ledgerStaking = engine.products.whalesStakingPools.useStaking(ledgerAddress);
    const staking = isLedger ? ledgerStaking : stakingMain;

    const pools = staking?.pools ?? [];
    const poolsWithStake = pools.filter((v) => v.balance.gtn(0));
    const items: ReactElement[] = [];
    const processed = new Set<string>();

    const onJoinClub = useCallback(() => openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club'), []);
    const onJoinTeam = useCallback(() => openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1'), []);
    const onEPNMore = useCallback(() => openWithInApp('https://epn.bz/'), []);

    // Await config
    if (!staking?.config) {
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
        const active: ReactElement[] = [];
        for (let p of poolsWithStake) {
            active.push(
                <StakingPool
                    key={`active-${p.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={p.address}
                    balance={p.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
            processed.add(p.address.toFriendly({ testOnly: AppConfig.isTestnet }));
        }

        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'active-header'}
                    text={t('products.staking.pools.active')}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {active}
                </View>
            </View>
        )
    }

    // Recommended
    let recommended = pools.find((v) => v.address.equals(Address.parse(staking.config!.recommended)));

    if (recommended && !processed.has(recommended.address.toFriendly({ testOnly: AppConfig.isTestnet }))) {
        const rec: ReactElement[] = [];
        rec.push(
            <StakingPool
                key={`best-${recommended.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                address={recommended.address}
                balance={recommended.balance}
                engine={engine}
                isLedger={isLedger}
            />
        );
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'best-header'}
                    text={t('products.staking.pools.best')}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {rec}
                </View>
            </View>
        )
    }

    let club = filterPools(pools, 'club', processed, AppConfig.isTestnet);
    let team = filterPools(pools, 'team', processed, AppConfig.isTestnet);
    let nominators = filterPools(pools, 'nominators', processed, AppConfig.isTestnet);
    let epn = filterPools(pools, 'epn', processed, AppConfig.isTestnet);
    let lockups = filterPools(pools, 'lockup', processed, AppConfig.isTestnet);
    let tonkeeper = filterPools(pools, 'tonkeeper', processed, AppConfig.isTestnet);

    if (epn.length > 0) {
        const epnItems: ReactElement[] = [];

        for (let pool of epn) {
            epnItems.push(
                <StakingPool
                    key={`epn-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'epn-header'}
                    text={t('products.staking.pools.epnPartners')}
                    description={t('products.staking.pools.epnPartnersDescription')}
                    action={{
                        title: t('products.staking.pools.moreAboutEPN'),
                        onAction: onEPNMore
                    }}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {epnItems}
                </View>
            </View>
        )
    }

    if (nominators.length > 0) {
        const nominatorsItems: ReactElement[] = [];

        for (let pool of nominators) {
            nominatorsItems.push(
                <StakingPool
                    key={`nominators-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'nomanators-header'}
                    text={t('products.staking.pools.nominators')}
                    description={t('products.staking.pools.nominatorsDescription')}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {nominatorsItems}
                </View>
            </View>
        );
    }

    if (club.length > 0) {
        const clubItems: ReactElement[] = [];
        for (let pool of club) {
            clubItems.push(
                <StakingPool
                    key={`club-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'club-header'}
                    text={t('products.staking.pools.club')}
                    description={t('products.staking.pools.clubDescription')}
                    action={{
                        title: t('products.staking.pools.joinClub'),
                        onAction: onJoinClub
                    }}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {clubItems}
                </View>
            </View>
        );
    }

    if (lockups.length > 0) {
        const lockupsItems: ReactElement[] = [];

        for (let pool of lockups) {
            lockupsItems.push(
                <StakingPool
                    key={`lockup-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'lockups-header'}
                    text={t('products.staking.pools.lockups')}
                    description={t('products.staking.pools.lockupsDescription')}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {lockupsItems}
                </View>
            </View>
        );
    }

    if (team.length > 0) {
        const teamItems: ReactElement[] = [];
        for (let pool of team) {
            teamItems.push(
                <StakingPool
                    key={`team-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'team-header'}
                    text={t('products.staking.pools.team')}
                    description={t('products.staking.pools.teamDescription')}
                    action={{
                        title: t('products.staking.pools.joinTeam'),
                        onAction: onJoinTeam
                    }}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {teamItems}
                </View>
            </View>
        );
    }

    if (tonkeeper.length > 0) {
        const keeperItems: ReactElement[] = [];
        for (let pool of tonkeeper) {
            keeperItems.push(
                <StakingPool
                    key={`tonkeeper-${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}`}
                    address={pool.address}
                    balance={pool.balance}
                    engine={engine}
                    isLedger={isLedger}
                />
            );
        }
        items.push(
            <View style={{ borderRadius: 20, backgroundColor: Theme.border, marginBottom: 20 }}>
                <StakingPoolsHeader
                    key={'tonkeeper-header'}
                    text={t('products.staking.pools.tonkeeper')}
                    description={t('products.staking.pools.tonkeeperDescription')}
                />
                <View style={{
                    backgroundColor: Theme.white,
                    marginHorizontal: 4, marginBottom: 4,
                    borderRadius: 20
                }}>
                    {keeperItems}
                </View>
            </View>
        );
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: t('products.staking.pools.title'),
        })
    }, []);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle('dark');
        }, 100);
    });

    return (
        <View style={{
            flex: 1,
            flexGrow: 1,
            paddingBottom: safeArea.bottom,
        }}>
            <StatusBar style={'dark'} />
            <ScrollView
                alwaysBounceVertical={false}
                style={{
                    flexShrink: 1,
                    flexGrow: 1,
                }}
                contentContainerStyle={{
                    paddingTop: 8,
                    paddingHorizontal: 16
                }}
                contentInset={{
                    bottom: 24,
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