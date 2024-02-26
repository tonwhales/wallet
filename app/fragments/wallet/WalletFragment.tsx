import * as React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { nullTransfer, useTypedNavigation } from '../../utils/useTypedNavigation';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { fragment } from '../../fragment';
import { Suspense, memo, useCallback, useMemo } from 'react';
import { WalletAddress } from '../../components/address/WalletAddress';
import { WalletHeader } from './views/WalletHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fullScreen } from '../../Navigation';
import { StakingFragment } from '../staking/StakingFragment';
import { StakingPoolsFragment } from '../staking/StakingPoolsFragment';
import { useAccountLite, useHoldersAccounts, useNetwork, useSelectedAccount, useStaking, useTheme } from '../../engine/hooks';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { AccountLite } from '../../engine/hooks/accounts/useAccountLite';
import { toNano } from '@ton/core';
import { SelectedAccount } from '../../engine/types';
import { WalletSkeleton } from '../../components/skeletons/WalletSkeleton';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Typography } from '../../components/styles';

function WalletComponent(props: { wallet: AccountLite | null, selectedAcc: SelectedAccount }) {
    const network = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const address = props.selectedAcc.address;
    const account = props.wallet;
    const staking = useStaking();
    const holdersCards = useHoldersAccounts(address).data?.accounts;
    const bottomBarHeight = useBottomTabBarHeight();

    const stakingBalance = useMemo(() => {
        if (!staking) {
            return 0n;
        }
        return staking.total;
    }, [staking]);

    const balance = useMemo(() => {
        const accountWithStaking = (account ? account?.balance : 0n)
            + (stakingBalance || 0n)

        const cardsBalance = holdersCards?.reduce((summ, card) => {
            return summ + BigInt(card.balance);
        }, 0n);

        return (cardsBalance || 0n) + accountWithStaking;
    }, [account, stakingBalance, holdersCards]);

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const onOpenBuy = useCallback(() => navigation.navigate('Buy'), []);

    return (
        <View style={{ flexGrow: 1, backgroundColor: theme.backgroundPrimary }}>
            <WalletHeader />
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
                            {!network.isTestnet && (
                                <View style={{
                                    flexGrow: 1, flexBasis: 0,
                                    marginRight: 7,
                                    borderRadius: 14,
                                    paddingVertical: 10
                                }}>
                                    <Pressable
                                        onPress={onOpenBuy}
                                        style={({ pressed }) => ({
                                            opacity: pressed ? 0.5 : 1,
                                            borderRadius: 14, flex: 1, paddingVertical: 10,
                                            marginHorizontal: 10
                                        })}
                                    >
                                        <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                            <View style={{
                                                backgroundColor: theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Image source={require('@assets/ic-buy.png')} />
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
                                                {t('wallet.actions.buy')}
                                            </Text>
                                        </View>
                                    </Pressable>
                                </View>
                            )}
                            <View style={{
                                flexGrow: 1, flexBasis: 0,
                                marginRight: 7,
                                borderRadius: 14,
                                paddingVertical: 10
                            }}>
                                <Pressable
                                    onPress={() => navigation.navigate('Receive')}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
                                            borderRadius: 14, flex: 1, paddingVertical: 10,
                                            marginHorizontal: 10
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
                                        <Text
                                            style={{
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
                                paddingVertical: 10,
                            }}>
                                <Pressable
                                    onPress={() => navigation.navigateSimpleTransfer(nullTransfer)}
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
                                            borderRadius: 14, flex: 1, paddingVertical: 10,
                                            marginHorizontal: 10
                                        }
                                    }}
                                >
                                    <View style={{ alignItems: 'center', borderRadius: 14, flexGrow: 1 }}>
                                        <View style={{
                                            backgroundColor: theme.accent,
                                            width: 32, height: 32,
                                            borderRadius: 16,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('@assets/ic_send.png')} />
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                color: theme.textPrimary,
                                                marginTop: 6,
                                                fontWeight: '500',
                                            }}
                                        >
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
                <ProductsComponent selected={props.selectedAcc} />
            </ScrollView>
        </View>
    );
}

const skeleton = (
    <View style={{ position: 'absolute', top: -100, bottom: 0, left: 0, right: 0 }}>
        <WalletSkeleton />
    </View>
)

export const WalletFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const selectedAcc = useSelectedAccount();
    const accountLite = useAccountLite(selectedAcc?.address);

    return (
        <>
            <StatusBar style={'light'} />
            <PerformanceMeasureView
                interactive={accountLite !== undefined && selectedAcc !== undefined}
                screenName={'Wallet'}
            >
                {!selectedAcc ? (skeleton) : (
                    <Suspense fallback={skeleton}>
                        <WalletComponent
                            selectedAcc={selectedAcc}
                            wallet={accountLite}
                        />
                    </Suspense>
                )}
            </PerformanceMeasureView>
        </>
    );
});

const Stack = createNativeStackNavigator();
Stack.Navigator.displayName = 'WalletStack';

const navigation = (safeArea: EdgeInsets) => [
    fullScreen('Wallet', WalletFragment),
    fullScreen('Staking', StakingFragment),
    fullScreen('StakingPools', StakingPoolsFragment),
]

export const WalletNavigationStack = memo(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

    useFocusEffect(() => {
        setStatusBarStyle('light');
    });

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