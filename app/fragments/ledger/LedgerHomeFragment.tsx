import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../../i18n/t";
import { Pressable, View, Platform, ScrollView, RefreshControl } from "react-native";
import { PriceComponent } from "../../components/PriceComponent";
import { WalletAddress } from "../../components/address/WalletAddress";
import { LedgerWalletHeader } from "./components/LedgerWalletHeader";
import { useAccountLite, useHoldersAccountStatus, useLiquidStakingBalance, useNetwork, useStaking, useSyncState, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { Address, toNano } from "@ton/core";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fullScreen } from "../../Navigation";
import { StakingFragment } from "../staking/StakingFragment";
import { StakingPoolsFragment } from "../staking/StakingPoolsFragment";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useSpecialJetton } from "../../engine/hooks/jettons/useSpecialJetton";
import { LiquidStakingFragment } from "../staking/LiquidStakingFragment";
import { queryClient } from "../../engine/clients";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { Queries } from "../../engine/queries";
import { TonWalletFragment } from "../wallet/TonWalletFragment";
import { Typography } from "../../components/styles";
import { WalletActions } from "../wallet/views/WalletActions";
import { JettonWalletFragment } from "../wallet/JettonWalletFragment";

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
    const account = useAccountLite(address!, { refetchOnMount: true })!;
    const staking = useStaking(address!);
    const liquidBalance = useLiquidStakingBalance(address!);
    const network = useNetwork();
    const specialJetton = useSpecialJetton(address!);
    const specialJettonWallet = specialJetton?.wallet?.toString({ testOnly: network.isTestnet });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const stakingBalance = useMemo(() => {
        if (!staking) {
            return 0n;
        }
        return liquidBalance + staking.total;
    }, [staking, liquidBalance]);

    const balance = useMemo(() => {
        const accountWithStaking = (account ? BigInt(account.balance) : 0n)
            + (stakingBalance || 0n);

        return accountWithStaking + (specialJetton?.toTon ?? 0n);
    }, [account, stakingBalance, specialJetton?.toTon]);

    // Navigation
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

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
            {!!address && <LedgerWalletHeader address={address} />}
            <ScrollView
                style={{ flexBasis: 0 }}
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
                            backgroundColor: theme.backgroundUnchangeable,
                            height: 1000,
                            position: 'absolute',
                            top: -1000,
                            left: 0,
                            right: 0,
                        }}
                    />
                )}
                <View collapsable={false}>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingTop: 24,
                        paddingHorizontal: 16,
                        backgroundColor: theme.backgroundUnchangeable
                    }}>
                        <View>
                            <PriceComponent
                                amount={balance}
                                style={{
                                    alignSelf: 'center',
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: undefined,
                                    paddingVertical: undefined,
                                    paddingLeft: undefined,
                                    borderRadius: undefined,
                                    height: undefined,
                                }}
                                textStyle={{
                                    fontSize: 32,
                                    color: theme.textOnsurfaceOnDark,
                                    fontWeight: '500',
                                    lineHeight: 38
                                }}
                                centsTextStyle={{ color: theme.textSecondary }}
                                theme={theme}
                            />
                            {!account && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        overflow: 'hidden',
                                        borderRadius: 8,
                                    }}
                                >
                                    {Platform.OS === 'android' ? (
                                        <View
                                            style={{
                                                flexGrow: 1,
                                                backgroundColor: theme.surfaceOnBg,
                                            }}
                                        />
                                    ) : (
                                        <BlurView
                                            tint={theme.style === 'dark' ? 'dark' : 'light'}
                                            style={{ flexGrow: 1 }}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                        <Pressable
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
                            onPress={navigateToCurrencySettings}
                        >
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }}
                                textStyle={{ color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary }}
                                theme={theme}
                            />
                        </Pressable>
                        <View style={{ flexGrow: 1 }} />
                        <WalletAddress
                            address={address!}
                            elipsise={{ start: 4, end: 4 }}
                            style={{
                                marginTop: 16,
                                alignSelf: 'center',
                            }}
                            textStyle={[{
                                color: theme.textUnchangeable,
                                opacity: 0.5,
                                fontFamily: undefined
                            }, Typography.regular15_20]}
                            disableContextMenu
                            copyOnPress
                            copyToastProps={Platform.select({
                                ios: { marginBottom: 24 + bottomBarHeight, },
                                android: { marginBottom: 16, }
                            })}
                            theme={theme}
                            bounceable={false}
                        />
                    </View>
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
            </ScrollView>
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