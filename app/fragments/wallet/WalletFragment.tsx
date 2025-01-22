import * as React from 'react';
import { Alert, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { fragment } from '../../fragment';
import { Suspense, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { WalletAddress } from '../../components/address/WalletAddress';
import { WalletHeader } from './views/WalletHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fullScreen } from '../../Navigation';
import { StakingFragment } from '../staking/StakingFragment';
import { StakingPoolsFragment } from '../staking/StakingPoolsFragment';
import { useAccountLite, useHoldersAccounts, useHoldersAccountStatus, useLiquidStakingBalance, useNetwork, usePrice, useSelectedAccount, useStaking, useSyncState, useTheme } from '../../engine/hooks';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { Address, toNano } from '@ton/core';
import { SelectedAccount } from '../../engine/types';
import { WalletSkeleton } from '../../components/skeletons/WalletSkeleton';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Typography } from '../../components/styles';
import { useSpecialJetton } from '../../engine/hooks/jettons/useSpecialJetton';
import { LiquidStakingFragment } from '../staking/LiquidStakingFragment';
import { WalletActions } from './views/WalletActions';
import { reduceHoldersBalances } from '../../utils/reduceHoldersBalances';
import { VersionView } from './views/VersionView';
import { JettonWalletFragment } from './JettonWalletFragment';
import { queryClient } from '../../engine/clients';
import { HoldersUserState } from '../../engine/api/holders/fetchUserState';
import { Queries } from '../../engine/queries';
import { TonWalletFragment } from './TonWalletFragment';
import { getCampaignId } from '../../utils/CachedLinking';
import { mixpanelAddReferrer, mixpanelIdentify } from '../../analytics/mixpanel';

const WalletCard = memo(({ address }: { address: Address }) => {
    const account = useAccountLite(address);
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const bottomBarHeight = useBottomTabBarHeight();
    const specialJetton = useSpecialJetton(address);
    const staking = useStaking();
    const liquidBalance = useLiquidStakingBalance(address);
    const holdersCards = useHoldersAccounts(address).data?.accounts;
    const [price] = usePrice();

    const stakingBalance = useMemo(() => {
        if (!staking && !liquidBalance) {
            return 0n;
        }
        return liquidBalance + staking.total;
    }, [staking, liquidBalance]);

    const balance = useMemo(() => {
        const accountWithStaking = (account ? account?.balance : 0n)
            + (stakingBalance || 0n)

        const cardsBalance = reduceHoldersBalances(holdersCards ?? [], price?.price?.usd ?? 1);

        return (cardsBalance || 0n) + accountWithStaking + (specialJetton?.toTon || 0n);
    }, [account, stakingBalance, holdersCards, specialJetton?.toTon, price?.price?.usd]);

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    return (
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
                    textStyle={[{ color: theme.textOnsurfaceOnDark }, Typography.semiBold32_38]}
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
                address={address}
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
            />
        </View>
    );
});
WalletCard.displayName = 'WalletCard';

const WalletComponent = memo(({ selectedAcc }: { selectedAcc: SelectedAccount }) => {
    const network = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const address = selectedAcc.address;
    const addressString = address.toString({ testOnly: network.isTestnet });
    const bottomBarHeight = useBottomTabBarHeight();
    const syncState = useSyncState(addressString);
    const holdersStatus = useHoldersAccountStatus(addressString).data;
    const specialJetton = useSpecialJetton(address);
    const specialJettonWallet = specialJetton?.wallet?.toString({ testOnly: network.isTestnet });

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (syncState !== 'updating') {
            setIsRefreshing(false);
        }
    }, [syncState]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        queryClient.refetchQueries({
            predicate: query => {
                const otpKey = Queries.Holders(addressString).OTP();

                if (query.queryKey.join(',') === otpKey.join(',')) {
                    return true;
                }

                if (
                    query.queryKey[0] === 'account'
                    && query.queryKey[1] === addressString
                    && query.queryKey[2] === 'lite'
                ) {
                    return true;
                }

                if (
                    query.queryKey[0] === 'hints'
                    && query.queryKey[1] === 'full'
                    && query.queryKey[2] === addressString
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

                const holdersQueryKey = Queries.Holders(addressString).Cards(!!token ? 'private' : 'public');

                if (query.queryKey.join(',') === holdersQueryKey.join(',')) {
                    return true;
                }

                return false;
            }
        });
    }, [network, addressString, holdersStatus, specialJettonWallet]);

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <WalletHeader address={address} />
            <ScrollView
                style={{ flexBasis: 0 }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                contentInsetAdjustmentBehavior={"never"}
                automaticallyAdjustContentInsets={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
                overScrollMode={'never'}
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
                    <WalletCard address={address} />
                    <WalletActions
                        theme={theme}
                        navigation={navigation}
                        isTestnet={network.isTestnet}
                        address={address}
                    />
                </View>
                <ProductsComponent selected={selectedAcc} />
            </ScrollView>
            <VersionView />
        </View>
    );
});
WalletComponent.displayName = 'WalletComponent';

const skeleton = (
    <View style={{ position: 'absolute', top: -100, bottom: 0, left: 0, right: 0 }}>
        <WalletSkeleton />
    </View>
)

export const WalletFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const selectedAcc = useSelectedAccount();

    useEffect(() => {
        if (!selectedAcc) {
            return;
        }

        try {
            const id = getCampaignId();
            if (!!id) {
                mixpanelAddReferrer(id);
            }

            mixpanelIdentify(selectedAcc?.address.toString({ testOnly: isTestnet }), isTestnet);
        } catch (error) {
            Alert.alert('Error', JSON.stringify(error));
        }

    }, [selectedAcc?.addressString, isTestnet]);

    return (
        <>
            <StatusBar style={'light'} />
            <PerformanceMeasureView
                interactive={selectedAcc !== undefined}
                screenName={'Wallet'}
            >
                {!selectedAcc ? (skeleton) : (
                    <Suspense fallback={skeleton}>
                        <WalletComponent selectedAcc={selectedAcc} />
                    </Suspense>
                )}
            </PerformanceMeasureView>
        </>
    );
});
WalletFragment.displayName = 'WalletFragment';

const Stack = createNativeStackNavigator();
Stack.Navigator.displayName = 'WalletStack';

const navigation = (safeArea: EdgeInsets) => [
    fullScreen('Wallet', WalletFragment),
    fullScreen('Staking', StakingFragment),
    fullScreen('StakingPools', StakingPoolsFragment),
    fullScreen('LiquidStaking', LiquidStakingFragment),
    fullScreen('JettonWalletFragment', JettonWalletFragment),
    fullScreen('TonWallet', TonWalletFragment)
]

export const WalletNavigationStack = memo(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

    return (
        <Stack.Navigator
            initialRouteName={'Wallet'}
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