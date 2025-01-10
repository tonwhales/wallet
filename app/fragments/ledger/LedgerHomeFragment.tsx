import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../../i18n/t";
import { Pressable, View, Image, Text, Platform, ScrollView, RefreshControl } from "react-native";
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
import { TonWalletFragment } from "../wallet/TonWalletFragment";

export const LedgerHomeFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();

    const address = useMemo(() => {
        if (!ledgerContext?.addr) {
            return null;
        }
        try {
            return Address.parse(ledgerContext.addr.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);
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

    const navigateTransfer = useCallback(async () => {
        if (ledgerContext.tonTransport && !ledgerContext.isReconnectLedger) {
            navigation.navigate('LedgerSimpleTransfer', {
                amount: null,
                target: null,
                comment: null,
                jetton: null,
                stateInit: null,
                job: null,
                callback: null
            });
            return;
        }

        ledgerContext.reset();
        ledgerContext.onShowLedgerConnectionError();
    }, [ledgerContext]);

    const navigateReceive = useCallback(() => {
        if (!addressFriendly) {
            return;
        }
        navigation.navigate(
            'LedgerReceive',
            { addr: addressFriendly, ledger: true }
        );
    }, [addressFriendly]);

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
                            textStyle={{
                                fontSize: 15,
                                lineHeight: 20,
                                color: theme.textUnchangeable,
                                fontWeight: '400',
                                opacity: 0.5,
                                fontFamily: undefined
                            }}
                            disableContextMenu
                            copyOnPress
                            copyToastProps={Platform.select({
                                ios: { marginBottom: 24 + bottomBarHeight, },
                                android: { marginBottom: 16, }
                            })}
                            theme={theme}
                        />
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={{
                            backgroundColor: theme.backgroundUnchangeable,
                            position: 'absolute', top: Platform.OS === 'android' ? -1 : 0, left: 0, right: 0,
                            height: '50%',
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 20,
                        }} />
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: theme.surfaceOnBg,
                                borderRadius: 20,
                                marginTop: 28,
                                overflow: 'hidden'
                            }}
                            collapsable={false}
                        >
                            <View style={{
                                flexGrow: 1, flexBasis: 0,
                                marginRight: 7,
                                borderRadius: 14,
                                padding: 10
                            }}>
                                <Pressable
                                    onPress={navigateReceive}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
                                            borderRadius: 14, flex: 1, paddingVertical: 10,
                                            marginHorizontal: 20
                                        }
                                    }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View style={{
                                            backgroundColor: theme.accent,
                                            width: 32, height: 32,
                                            borderRadius: 16,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('@assets/ic_receive.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}
                                            minimumFontScale={0.7}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                        >
                                            {t('wallet.actions.receive')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                            <View style={{
                                flexGrow: 1, flexBasis: 0,
                                marginRight: 7,
                                borderRadius: 14,
                                padding: 10
                            }}>
                                <Pressable
                                    onPress={navigateTransfer}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
                                            borderRadius: 14, flex: 1, paddingVertical: 10,
                                            marginHorizontal: 20
                                        }
                                    }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View style={{
                                            backgroundColor: theme.accent,
                                            width: 32, height: 32,
                                            borderRadius: 16,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('@assets/ic_send.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}
                                            minimumFontScale={0.7}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                        >
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
                <LedgerProductsComponent
                    testOnly={isTestnet}
                    addr={address!.toString({ testOnly: isTestnet })}
                />
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