import * as React from 'react';
import { Alert, Platform, RefreshControl, View } from 'react-native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { Suspense, memo, useCallback, useEffect, useState } from 'react';
import { WalletHeader } from './views/WalletHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fullScreen } from '../../Navigation';
import { StakingFragment } from '../staking/StakingFragment';
import { StakingPoolsFragment } from '../staking/StakingPoolsFragment';
import { useHoldersAccountStatus, useNetwork, useSelectedAccount, useSyncState, useTheme, useWalletCardLayoutHelper } from '../../engine/hooks';
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
import { useLedgerTransport } from '../ledger/components/TransportContext';

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
    const [isWalletMode] = useAppMode(address);
    const safeArea = useSafeAreaInsets();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const { walletCardHeight, walletHeaderHeight, scrollHandler, scrollOffsetSv } = useWalletCardLayoutHelper()

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
            <WalletHeader address={address} walletCardHeight={walletCardHeight} height={walletHeaderHeight} scrollOffsetSv={scrollOffsetSv} />
            <Animated.ScrollView
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
                    <WalletCard address={address} height={walletCardHeight} walletHeaderHeight={walletHeaderHeight} />
                    <WalletActions
                        theme={theme}
                        navigation={navigation}
                        isTestnet={network.isTestnet}
                        address={address}
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
    const ledgerContext = useLedgerTransport();
    useEffect(() => {
        ledgerContext?.setAddr({ address: 'EQDSUWCZ-o3pqV4-0Fb2NtgykQcb1Hz4cnXJEnKUozspkuUK' })
    }, [])

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
    fullScreen('JettonWallet', JettonWalletFragment),
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