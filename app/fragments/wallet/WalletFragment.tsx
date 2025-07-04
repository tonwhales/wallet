import * as React from 'react';
import { Alert, Platform, RefreshControl, View } from 'react-native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { Suspense, memo, useCallback, useEffect, useState, useRef } from 'react';
import { WalletHeader } from './views/WalletHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fullScreen } from '../../Navigation';
import { StakingFragment } from '../staking/StakingFragment';
import { StakingPoolsFragment } from '../staking/StakingPoolsFragment';
import { useHoldersAccountStatus, useNetwork, useSelectedAccount, useSolanaSelectedAccount, useSyncState, useTheme, useWalletCardLayoutHelper } from '../../engine/hooks';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { SelectedAccount } from '../../engine/types';
import { WalletSkeleton } from '../../components/skeletons/WalletSkeleton';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSpecialJetton } from '../../engine/hooks/jettons/useSpecialJetton';
import { LiquidStakingFragment } from '../staking/LiquidStakingFragment';
import { WalletActions } from './views/WalletActions';
import { VersionView } from './views/VersionView';
import { JettonWalletFragment } from './JettonWalletFragment';
import { queryClient } from '../../engine/clients';
import { HoldersUserState } from '../../engine/api/holders/fetchUserState';
import { Queries } from '../../engine/queries';
import { TonWalletFragment } from './TonWalletFragment';
import { mixpanelAddReferrer, mixpanelIdentify } from '../../analytics/mixpanel';
import { getCampaignId } from '../../utils/holders/queryParamsStore';
import { useAppMode } from '../../engine/hooks/appstate/useAppMode';
import Animated from 'react-native-reanimated';
import { WalletCard } from './views/WalletCard';
import { SolanaTokenWalletFragment } from './SolanaTokenWalletFragment';
import { SolanaWalletFragment } from './SolanaWalletFragment';
import { LiquidUSDeStakingFragment } from '../staking/LiquidUSDeStakingFragment';
import { AppModeToggle } from '../../components/AppModeToggle';

const WalletComponent = memo(({ selectedAcc }: { selectedAcc: SelectedAccount & { solanaAddress: string } }) => {
    const network = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { address, solanaAddress, publicKey: pubKey } = selectedAcc;
    const addressString = address.toString({ testOnly: network.isTestnet });
    const bottomBarHeight = useBottomTabBarHeight();
    const syncState = useSyncState(addressString);
    const holdersStatus = useHoldersAccountStatus(addressString).data;
    const specialJetton = useSpecialJetton(address);
    const specialJettonWallet = specialJetton?.wallet?.toString({ testOnly: network.isTestnet });
    const [isWalletMode] = useAppMode(address);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const { walletCardHeight, walletHeaderHeight, scrollHandler, scrollOffsetSv, headerTopPadding } = useWalletCardLayoutHelper()

    const scrollRef = useRef<Animated.ScrollView>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: true });
        }
    }, [isWalletMode]);

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

                if (
                    query.queryKey[0] === 'solana'
                    && query.queryKey[1] === solanaAddress
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
    }, [network, addressString, holdersStatus, specialJettonWallet, solanaAddress]);

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <WalletHeader address={address} walletCardHeight={walletCardHeight} height={walletHeaderHeight} scrollOffsetSv={scrollOffsetSv} />
            <AppModeToggle
                scrollOffsetSv={scrollOffsetSv}
                walletHeaderHeight={walletHeaderHeight}
                headerTopPadding={headerTopPadding}
            />
            <Animated.ScrollView
                ref={scrollRef}
                style={{ flexBasis: 0 }}
                onScroll={scrollHandler}
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
                    <WalletCard
                        address={address}
                        pubKey={pubKey}
                        height={walletCardHeight}
                        walletHeaderHeight={walletHeaderHeight}
                    />
                    <WalletActions
                        theme={theme}
                        navigation={navigation}
                        isTestnet={network.isTestnet}
                        address={address}
                        solanaAddress={solanaAddress}
                    />
                </View>
                <ProductsComponent selected={selectedAcc} />
            </Animated.ScrollView>
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
    const solanaAddress = useSolanaSelectedAccount()!;

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
                {(!selectedAcc || !solanaAddress) ? (skeleton) : (
                    <Suspense fallback={skeleton}>
                        <WalletComponent selectedAcc={{ ...selectedAcc, solanaAddress }} />
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
    fullScreen('LiquidUSDeStaking', LiquidUSDeStakingFragment),
    fullScreen('JettonWallet', JettonWalletFragment),
    fullScreen('SolanaWallet', SolanaWalletFragment),
    fullScreen('SolanaTokenWallet', SolanaTokenWalletFragment),
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