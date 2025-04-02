import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../../i18n/t";
import { View, Platform, RefreshControl } from "react-native";
import { LedgerWalletHeader } from "./components/LedgerWalletHeader";
import { useHoldersAccountStatus, useLinksSubscription, useNetwork, useSyncState, useTheme, useWalletCardLayoutHelper } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { Address } from "@ton/core";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fullScreen } from "../../Navigation";
import { StakingFragment } from "../staking/StakingFragment";
import { StakingPoolsFragment } from "../staking/StakingPoolsFragment";
import { useFocusEffect } from "@react-navigation/native";
import { useSpecialJetton } from "../../engine/hooks/jettons/useSpecialJetton";
import { LiquidStakingFragment } from "../staking/LiquidStakingFragment";
import { queryClient } from "../../engine/clients";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { Queries } from "../../engine/queries";
import { TonWalletFragment } from "../wallet/TonWalletFragment";
import { WalletActions } from "../wallet/views/WalletActions";
import { JettonWalletFragment } from "../wallet/JettonWalletFragment";
import Animated from "react-native-reanimated";
import { WalletCard } from "../wallet/views/WalletCard";
import { useAppMode } from "../../engine/hooks/appstate/useAppMode";

export const LedgerHomeFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();

    const wallet = useMemo(() => {
        if (!ledgerContext?.addr) {
            return null;
        }
        try {
            Address.parse(ledgerContext.addr.address);
            return ledgerContext.addr;
        } catch {
            return null;
        }
    }, [ledgerContext?.addr?.address]);
    const address = wallet ? Address.parse(wallet?.address) : null;
    const addressFriendly = address?.toString({ testOnly: isTestnet });

    const syncState = useSyncState(addressFriendly);
    const holdersStatus = useHoldersAccountStatus(address!).data;
    const network = useNetwork();
    const specialJetton = useSpecialJetton(address!);
    const specialJettonWallet = specialJetton?.wallet?.toString({ testOnly: network.isTestnet });
    const { walletCardHeight, walletHeaderHeight, scrollHandler, scrollOffsetSv } = useWalletCardLayoutHelper()
    const [isWalletMode] = useAppMode(address, { isLedger: true });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Subscribe for links
    useLinksSubscription({ isLedger: true });

    useEffect(() => {
        if (syncState !== 'updating') {
            setIsRefreshing(false);
        }
    }, [syncState]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        queryClient.refetchQueries({
            predicate: query => {
                if (
                    query.queryKey[0] === 'account'
                    && query.queryKey[1] === addressFriendly
                    && query.queryKey[2] === 'lite'
                ) {
                    return true;
                }

                if (
                    query.queryKey[0] === 'hints'
                    && query.queryKey[1] === 'full'
                    && query.queryKey[2] === addressFriendly
                ) {
                    return true;
                }

                if (
                    query.queryKey[0] === 'account'
                    && query.queryKey[1] === specialJettonWallet
                    && query.queryKey[2] === 'jettonWallet'
                ) {
                    return true;
                }

                const token = (
                    !!holdersStatus &&
                    holdersStatus.state === HoldersUserState.Ok
                ) ? holdersStatus.token : null;

                const holdersQueryKey = Queries.Holders(addressFriendly!).Cards(!!token ? 'private' : 'public');

                if (query.queryKey.join(',') === holdersQueryKey.join(',')) {
                    return true;
                }

                return false;
            }
        });
    }, [network, addressFriendly, holdersStatus, specialJettonWallet]);

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={'light'} />
            {!!address && <LedgerWalletHeader address={address} walletCardHeight={walletCardHeight} height={walletHeaderHeight} scrollOffsetSv={scrollOffsetSv} />}
            <Animated.ScrollView
                style={{ flexBasis: 0 }}
                onScroll={scrollHandler}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.textUnchangeable}
                        style={{ zIndex: 2000 }}
                    />
                }
            >
                {Platform.OS === 'ios' && (
                    <View
                        style={{
                            backgroundColor: isWalletMode ? theme.backgroundUnchangeable : theme.cornflowerBlue,
                            height: 1000,
                            position: 'absolute',
                            top: -1000,
                            left: 0,
                            right: 0,
                        }}
                    />
                )}
                <View collapsable={false}>
                    <WalletCard address={address!} height={walletCardHeight} walletHeaderHeight={walletHeaderHeight} isLedger={true} />
                    <WalletActions
                        theme={theme}
                        navigation={navigation}
                        isTestnet={isTestnet}
                        isLedger={true}
                    />
                </View>
                {!!wallet && (
                    <LedgerProductsComponent
                        testOnly={isTestnet}
                        wallet={wallet}
                    />
                )}
            </Animated.ScrollView>
        </View>
    );
})

const Stack = createNativeStackNavigator();
Stack.Navigator.displayName = 'LedgerStack';

const navigation = (safeArea: EdgeInsets) => [
    fullScreen('Home', LedgerHomeFragment),
    fullScreen('LedgerStaking', StakingFragment),
    fullScreen('LedgerStakingPools', StakingPoolsFragment),
    fullScreen('LedgerLiquidStaking', LiquidStakingFragment),
    fullScreen('LedgerJettonWallet', JettonWalletFragment),
    fullScreen('LedgerTonWallet', TonWalletFragment)
]

export const LedgerNavigationStack = memo(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

    return (
        <Stack.Navigator
            initialRouteName={'Home'}
            screenOptions={{
                headerBackTitle: t('common.back'),
                title: '',
                headerShadowVisible: false,
                headerTransparent: false,
                headerStyle: { backgroundColor: theme.backgroundPrimary }
            }}
        >
            {navigation(safeArea)}
        </Stack.Navigator>
    );
});