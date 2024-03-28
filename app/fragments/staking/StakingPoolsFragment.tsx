import React, { ReactElement, useCallback, useMemo } from "react";
import { View, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { KnownPools, getLiquidStakingAddress } from "../../utils/KnownPools";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { openWithInApp } from "../../utils/openWithInApp";
import { TopBar } from "../../components/topbar/TopBar";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { StakingPoolsHeader } from "../../components/staking/StakingPoolsHeader";
import { StakingPool } from "../../components/staking/StakingPool";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Address } from "@ton/core";
import { useClient4, useNetwork, useSelectedAccount, useStakingPoolMembers, useStakingWalletConfig, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StakingPoolMember } from "../../engine/types";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LiquidStakingPool } from "../../components/staking/LiquidStakingPool";

export type StakingPoolType = 'club' | 'team' | 'nominators' | 'epn' | 'lockup' | 'tonkeeper' | 'liquid';

export function filterPools(pools: StakingPoolMember[], type: StakingPoolType, processed: Set<string>, isTestnet: boolean) {
    return pools.filter((v) => KnownPools(isTestnet)[v.pool].name.toLowerCase().includes(type) && !processed.has(v.pool));
}

export const StakingPoolsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const network = useNetwork();
    const client = useClient4(isTestnet);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();
    const bottomBarHeight = useBottomTabBarHeight();

    const isLedger = route.name === 'LedgerStakingPools';

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try { return Address.parse(ledgerContext?.addr?.address); } catch { }
    }, [ledgerContext?.addr?.address]);
    const memberAddress = isLedger ? ledgerAddress : selected?.address;

    const config = useStakingWalletConfig(memberAddress!.toString({ testOnly: network.isTestnet }));
    const members = useStakingPoolMembers(
        client,
        isTestnet,
        Object.keys(KnownPools(isTestnet)).map((v) => Address.parse(v)).map((p) => ({ pool: p, member: memberAddress! })),
    );

    const memberData = useMemo(() => {
        return members.filter((v) => !!v) as StakingPoolMember[];
    }, [members]);

    const poolsWithStake = useMemo(() => {
        return memberData.filter(
            (v) => v.balance > 0n
                || v.pendingDeposit > 0n
                || v.pendingWithdraw > 0n
                || v.withdraw > 0n
        );
    }, [memberData]);

    const items: ReactElement[] = [];
    const processed = new Set<string>();

    const onJoinClub = useCallback(() => openWithInApp(network.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club'), []);
    const onJoinTeam = useCallback(() => openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1'), []);
    const onEPNMore = useCallback(() => openWithInApp('https://epn.bz/'), []);

    // Await config
    if (!config) {
        return (
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                <TopBar title={t('products.staking.title')} showBack />
                <View style={{ flexGrow: 1, flexBasis: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator />
                </View>
            </View>
        );
    }

    const poolViewStyle = {
        borderRadius: 20,
        backgroundColor: theme.border,
        marginBottom: 20
    };

    const poolItemsStyle = {
        backgroundColor: theme.backgroundPrimary,
        marginHorizontal: 4, marginBottom: 4,
        borderRadius: 20
    }

    if (poolsWithStake.length > 0) {
        const active: ReactElement[] = [];
        for (let p of poolsWithStake) {
            active.push(
                <StakingPool
                    key={`active-${p.pool}`}
                    pool={Address.parse(p.pool)}
                    isLedger={isLedger}
                    balance={p.balance + p.pendingDeposit + p.pendingWithdraw + p.withdraw}
                    member={memberAddress!}
                />
            );
            processed.add(p.pool);
        }

        items.push(
            <View
                key={'active-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'active-header'}
                    text={t('products.staking.pools.active')}
                />
                <View style={poolItemsStyle}>
                    {active}
                </View>
            </View>
        )
    }

    // Recommended
    let recommended = memberData.find((v) => Address.parse(v!.pool).equals(Address.parse(config!.recommended)));

    if (recommended && !processed.has(recommended.pool)) {
        const rec: ReactElement[] = [];
        rec.push(
            <StakingPool
                key={`best-${recommended}`}
                pool={Address.parse(recommended.pool)}
                isLedger={isLedger}
                balance={recommended.balance}
                member={memberAddress!}
            />
        );
        items.push(
            <View
                key={'best-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'best-header'}
                    text={t('products.staking.pools.best')}
                />
                <View style={poolItemsStyle}>
                    {rec}
                </View>
            </View>
        )
    }

    // Liquid staking
    const liquidAddress = getLiquidStakingAddress(isTestnet);
    processed.add(liquidAddress.toString({ testOnly: isTestnet }));

    items.push(
        <View
            key={'liquid-staking'}
            style={poolViewStyle}
        >
            <LiquidStakingPool
                isLedger={isLedger}
                member={memberAddress!}
            />
        </View>
    );

    let club = filterPools(memberData, 'club', processed, network.isTestnet);
    let team = filterPools(memberData, 'team', processed, network.isTestnet);
    let nominators = filterPools(memberData, 'nominators', processed, network.isTestnet);
    let epn = filterPools(memberData, 'epn', processed, network.isTestnet);
    let lockups = filterPools(memberData, 'lockup', processed, network.isTestnet);
    let tonkeeper = filterPools(memberData, 'tonkeeper', processed, network.isTestnet);

    if (epn.length > 0) {
        const epnItems: ReactElement[] = [];

        for (let memberData of epn) {
            epnItems.push(
                <StakingPool
                    key={`epn-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'epn-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'epn-header'}
                    text={t('products.staking.pools.epnPartners')}
                    description={t('products.staking.pools.epnPartnersDescription')}
                    action={{
                        title: t('products.staking.pools.moreAboutEPN'),
                        onAction: onEPNMore
                    }}
                />
                <View style={poolItemsStyle}>
                    {epnItems}
                </View>
            </View>
        )
    }

    if (nominators.length > 0) {
        const nominatorsItems: ReactElement[] = [];

        for (let memberData of nominators) {
            nominatorsItems.push(
                <StakingPool
                    key={`nominators-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'nominators-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'nomanators-header'}
                    text={t('products.staking.pools.nominators')}
                    description={t('products.staking.pools.nominatorsDescription')}
                />
                <View style={poolItemsStyle}>
                    {nominatorsItems}
                </View>
            </View>
        );
    }

    if (club.length > 0) {
        const clubItems: ReactElement[] = [];
        for (let memberData of club) {
            clubItems.push(
                <StakingPool
                    key={`club-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'club-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'club-header'}
                    text={t('products.staking.pools.club')}
                    description={t('products.staking.pools.clubDescription')}
                    action={{
                        title: t('products.staking.pools.joinClub'),
                        onAction: onJoinClub
                    }}
                />
                <View style={poolItemsStyle}>
                    {clubItems}
                </View>
            </View>
        );
    }

    if (lockups.length > 0) {
        const lockupsItems: ReactElement[] = [];

        for (let memberData of lockups) {
            lockupsItems.push(
                <StakingPool
                    key={`lockup-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'lockups-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'lockups-header'}
                    text={t('products.staking.pools.lockups')}
                    description={t('products.staking.pools.lockupsDescription')}
                />
                <View style={poolItemsStyle}>
                    {lockupsItems}
                </View>
            </View>
        );
    }

    if (team.length > 0) {
        const teamItems: ReactElement[] = [];
        for (let memberData of team) {
            teamItems.push(
                <StakingPool
                    key={`team-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'team-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'team-header'}
                    text={t('products.staking.pools.team')}
                    description={t('products.staking.pools.teamDescription')}
                    action={{
                        title: t('products.staking.pools.joinTeam'),
                        onAction: onJoinTeam
                    }}
                />
                <View style={poolItemsStyle}>
                    {teamItems}
                </View>
            </View>
        );
    }

    if (tonkeeper.length > 0) {
        const keeperItems: ReactElement[] = [];
        for (let memberData of tonkeeper) {
            keeperItems.push(
                <StakingPool
                    key={`tonkeeper-${memberData.pool}`}
                    pool={Address.parse(memberData.pool)}
                    balance={memberData.balance}
                    isLedger={isLedger}
                    member={memberAddress!}
                />
            );
        }
        items.push(
            <View
                key={'tonkeeper-view'}
                style={poolViewStyle}
            >
                <StakingPoolsHeader
                    key={'tonkeeper-header'}
                    text={t('products.staking.pools.tonkeeper')}
                    description={t('products.staking.pools.tonkeeperDescription')}
                />
                <View style={poolItemsStyle}>
                    {keeperItems}
                </View>
            </View>
        );
    }

    // weird bug with status bar not changing color with component
    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{
            flex: 1,
            flexGrow: 1,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('products.staking.pools.title')}
                onBackPressed={navigation.goBack}
                style={{
                    paddingTop: safeArea.top - (Platform.OS === 'ios' ? 16 : 0),
                    paddingHorizontal: 16
                }}
            />
            <ScrollView
                alwaysBounceVertical={false}
                style={{ flexShrink: 1, flexGrow: 1 }}
                contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16 }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
            >
                <View style={{ flexGrow: 1 }}>
                    {items}
                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
        </View>
    );
});