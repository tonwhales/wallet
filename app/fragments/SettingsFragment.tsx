import * as React from 'react';
import { View, Text, Pressable, Image, Platform, Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { openWithInApp } from '../utils/openWithInApp';
import { useCallback, useMemo } from 'react';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as StoreReview from 'expo-store-review';
import { getAppState } from '../storage/appState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork, useBounceableWalletFormat, useOldWalletsBalances, usePrice, useSelectedAccount, useTheme, useThemeStyle, useHasHoldersProducts, useIsConnectAppReady, useLanguage } from '../engine/hooks';
import * as Application from 'expo-application';
import { useWalletSettings } from '../engine/hooks/appstate/useWalletSettings';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLedgerTransport } from './ledger/components/TransportContext';
import { Typography } from '../components/styles';
import { holdersUrl, HoldersUserState, holdersUrl as resolveHoldersUrl } from '../engine/api/holders/fetchUserState';
import { queryClient } from '../engine/clients';
import { getQueryData } from '../engine/utils/getQueryData';
import { Queries } from '../engine/queries';
import { getHoldersToken, HoldersAccountStatus, useHoldersAccountStatus } from '../engine/hooks/holders/useHoldersAccountStatus';
import { HoldersAccounts, useHoldersAccounts } from '../engine/hooks/holders/useHoldersAccounts';
import { useIsHoldersInvited } from '../engine/hooks/holders/useIsHoldersInvited';
import { HoldersAppParamsType } from './holders/HoldersAppFragment';
import { HeaderSyncStatus } from './wallet/views/HeaderSyncStatus';
import { lagnTitles } from '../i18n/i18n';
import { HoldersBannerType } from '../components/products/ProductsComponent';
import { HoldersBanner } from '../components/products/HoldersBanner';

import IcSecurity from '@assets/settings/ic-security.svg';
import IcSpam from '@assets/settings/ic-spam.svg';
import IcContacts from '@assets/settings/ic-contacts.svg';
import IcCurrency from '@assets/settings/ic-currency.svg';
import IcTerms from '@assets/settings/ic-terms.svg';
import IcPrivacy from '@assets/settings/ic-privacy.svg';
import IcSupport from '@assets/settings/ic-support.svg';
import IcTelegram from '@assets/settings/ic-tg.svg';
import IcRateApp from '@assets/settings/ic-rate-app.svg';
import IcTheme from '@assets/settings/ic-theme.svg';
import IcNewAddressFormat from '@assets/settings/ic-address-update.svg';

const iosStoreUrl = 'https://apps.apple.com/app/apple-store/id1607656232?action=write-review';
const androidStoreUrl = 'https://play.google.com/store/apps/details?id=com.tonhub.wallet&showAllReviews=true';

export const SettingsFragment = fragment(() => {
    const theme = useTheme();
    const [themeStyle] = useThemeStyle();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const { showActionSheetWithOptions } = useActionSheet();
    const currentWalletIndex = getAppState().selected;
    const selected = useSelectedAccount();
    const [walletSettings] = useWalletSettings(selected?.address);
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const [, currency] = usePrice();
    const [lang] = useLanguage();
    const [bounceableFormat] = useBounceableWalletFormat();
    const hasHoldersProducts = useHasHoldersProducts(selected?.address.toString({ testOnly: network.isTestnet }) || '');
    const inviteCheck = useIsHoldersInvited(selected?.address, network.isTestnet);
    const holdersAccStatus = useHoldersAccountStatus(selected?.address).data;
    const holdersAccounts = useHoldersAccounts(selected?.address).data;
    const url = holdersUrl(network.isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const route = useRoute();
    const isLedger = route.name === 'LedgerSettings';
    const showHoldersItem = !isLedger && hasHoldersProducts;
    const ledgerContext = useLedgerTransport();

    const hasHoldersAccounts = (holdersAccounts?.accounts?.length ?? 0) > 0;
    const showHoldersBanner = !isLedger && !hasHoldersAccounts && inviteCheck?.allowed;
    const holdersBanner: HoldersBannerType = !!inviteCheck?.settingsBanner ? { type: 'custom', banner: inviteCheck.settingsBanner } : { type: 'built-in' };
    const holderBannerContent = showHoldersBanner ? holdersBanner : null;
    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;

    const onHoldersPress = useCallback(() => {
        if (needsEnrollment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Accounts } }, network.isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Accounts }, network.isTestnet);
    }, [needsEnrollment, isHoldersReady, network.isTestnet]);

    const onVersionTap = useMemo(() => {
        let count = 0;
        let timer: any | null = null;
        return () => {
            count++;
            if (count > 5) {
                count = 0;
                navigation.navigate('DeveloperTools')
            } else {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    timer = null;
                    count = 0;
                }, 1000);
            }
        };
    }, []);

    const redirectToStore = () => {
        const storeUrl = Platform.OS === 'android' ? androidStoreUrl : iosStoreUrl;
        Linking.openURL(storeUrl);
    }

    const onRateApp = async () => {
        if (Platform.OS === 'android') {
            redirectToStore();
            return;
        }

        try {
            const isStoreReviewAvailable = await StoreReview.isAvailableAsync();

            if (!isStoreReviewAvailable) {
                redirectToStore();
                return;
            }
            const hasAction = await StoreReview.hasAction();

            if (!hasAction) {
                redirectToStore();
                return;
            }
            await StoreReview.requestReview();
        } catch (error) {
            redirectToStore();
        }
    };

    const onSupport = useCallback(() => {
        const tonhubOptions = [t('common.cancel'), t('settings.support.telegram'), t('settings.support.form')];
        const cancelButtonIndex = 0;
        const holdersUrl = resolveHoldersUrl(network.isTestnet);

        const tonhubSupportSheet = () => {
            showActionSheetWithOptions({
                options: tonhubOptions,
                title: t('settings.support.title'),
                cancelButtonIndex,
            }, (selectedIndex?: number) => {
                switch (selectedIndex) {
                    case 1:
                        openWithInApp('https://t.me/WhalesSupportBot');
                        break;
                    case 2:
                        openWithInApp('https://airtable.com/appWErwfR8x0o7vmz/shr81d2H644BNUtPN');
                        break;
                    default:
                        break;
                }
            });
        }

        if (!hasHoldersProducts) {
            tonhubSupportSheet();
            return;
        }

        const holdersOptions = [t('common.cancel'), t('settings.support.holders'), t('settings.support.tonhub')];

        const queryCache = queryClient.getQueryCache();
        const address = selected!.address.toString({ testOnly: network.isTestnet });
        const status = getQueryData<HoldersAccountStatus>(queryCache, Queries.Holders(address).Status());
        const token = status?.state === HoldersUserState.Ok ? status.token : getHoldersToken(address);
        const accountsStatus = getQueryData<HoldersAccounts>(queryCache, Queries.Holders(address).Cards(!!token ? 'private' : 'public'));

        const initialState = {
            ...status
                ? {
                    user: {
                        status: {
                            state: status.state,
                            kycStatus: status.state === 'need-kyc' ? status.kycStatus : null,
                            suspended: (status as { suspended: boolean | undefined }).suspended === true,
                        },
                        token
                    }
                }
                : { address },
            ...accountsStatus?.type === 'private'
                ? { accountsList: accountsStatus.accounts, prepaidCards: accountsStatus.prepaidCards }
                : {},
        };

        const holdersSupportSheet = () => {
            showActionSheetWithOptions({
                options: holdersOptions,
                title: t('settings.support.title'),
                cancelButtonIndex,
            }, (selectedIndex?: number) => {
                switch (selectedIndex) {
                    case 1:
                        navigation.navigateDAppWebView({
                            url: `${holdersUrl}/support`,
                            fullScreen: true,
                            webViewProps: {
                                injectedJavaScriptBeforeContentLoaded: `
                                (() => {
                                    window.initialState = ${JSON.stringify(initialState)};
                                })();
                                `,
                            },
                            useQueryAPI: true
                        });
                        break;
                    case 2:
                        tonhubSupportSheet();
                        break;
                    default:
                        break;
                }
            });
        };

        holdersSupportSheet();

    }, [hasHoldersProducts]);

    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, []);

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{
                marginTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                alignItems: 'center', justifyContent: 'center',
                width: '100%',
                paddingVertical: 6
            }}>
                <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
                <Pressable
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 32, paddingHorizontal: 12, paddingVertical: 4,
                        alignItems: 'center',
                        opacity: pressed ? 0.8 : 1,
                        maxWidth: '50%',
                    })}
                    onPress={onAccountPress}
                >
                    <Text
                        style={[{
                            color: theme.textPrimary, flexShrink: 1,
                            marginRight: 8
                        }, Typography.medium17_24]}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {isLedger ? ledgerContext.ledgerName : (walletSettings?.name || `${t('common.wallet')} ${currentWalletIndex + 1}`)}
                    </Text>
                    <HeaderSyncStatus isLedger={isLedger} />
                </Pressable>
            </View>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: theme.backgroundPrimary,
                    paddingHorizontal: 16,
                    flexBasis: 0,
                }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
            >
                {!!holderBannerContent && selected && holderBannerContent.type === 'custom' && (
                    <HoldersBanner
                        onPress={onHoldersPress}
                        isSettings={true}
                        address={selected.address}
                        {...holderBannerContent.banner}
                    />
                )}
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {!isLedger && (
                        <ItemButton
                            leftIconComponent={<IcSecurity width={24} height={24} />}
                            title={t('security.title')}
                            onPress={() => navigation.navigate('Security')}
                        />
                    )}
                    {showHoldersItem && (
                        <ItemButton
                            leftIcon={require('@assets/ic-card.png')}
                            title={t('settings.holdersAccounts')}
                            onPress={onHoldersPress}
                        />
                    )}
                    {oldWalletsBalance > 0n && (
                        <ItemButton
                            leftIcon={require('@assets/ic-wallets.png')}
                            title={t('settings.migrateOldWallets')}
                            onPress={() => navigation.navigate('Migration')}
                        />
                    )}
                    <ItemButton
                        leftIconComponent={<IcSpam width={24} height={24} />}
                        title={t('settings.spamFilter')}
                        onPress={() => navigation.navigate('SpamFilter')}
                    />
                    <ItemButton
                        leftIconComponent={<IcContacts width={24} height={24} />}
                        title={t('contacts.title')}
                        onPress={() => navigation.navigate('Contacts')}
                    />
                    <ItemButton
                        leftIconComponent={<IcCurrency width={24} height={24} />}
                        title={t('settings.primaryCurrency')}
                        onPress={() => navigation.navigate('Currency')}
                        hint={currency}
                    />
                    <ItemButton
                        leftIconComponent={<IcNewAddressFormat width={24} height={24} />}
                        title={t('newAddressFormat.title')}
                        onPress={() => navigation.navigate('NewAddressFormat')}
                        hint={selected?.address.toString({ testOnly: network.isTestnet, bounceable: bounceableFormat }).slice(0, 2)}
                    />
                </View>
                <View style={{
                    marginBottom: 16,
                    backgroundColor: theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<IcTheme width={24} height={24} />}
                        title={t('settings.theme')}
                        onPress={() => navigation.navigate('Theme')}
                        hint={t(`theme.${themeStyle}`)}
                    />
                    <ItemButton
                        leftIcon={require('@assets/ic-explorer.png')}
                        title={t('settings.language')}
                        onPress={() => navigation.navigate('Language')}
                        hint={lagnTitles[lang] || lang}
                    />
                    <ItemButton
                        leftIcon={require('@assets/ic-search.png')}
                        title={t('settings.searchEngine')}
                        onPress={() => navigation.navigate('SearchEngine')}
                    />
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<IcSupport width={24} height={24} />}
                        title={t('settings.support.title')}
                        onPress={onSupport}
                    />
                    <ItemButton
                        leftIconComponent={<IcTelegram width={24} height={24} />}
                        title={t('settings.telegram')}
                        onPress={() => openWithInApp('https://t.me/tonhub')}
                    />
                    <ItemButton
                        leftIconComponent={<IcRateApp width={24} height={24} />}
                        title={t('settings.rateApp')}
                        onPress={onRateApp}
                    />
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<IcTerms width={24} height={24} />}
                        title={t('settings.termsOfService')}
                        onPress={() => navigation.navigate('Terms')}
                    />
                    <ItemButton
                        leftIconComponent={<IcPrivacy width={24} height={24} />}
                        title={t('settings.privacyPolicy')}
                        onPress={() => navigation.navigate('Privacy')}
                    />
                </View>

                {__DEV__ && (
                    <View style={{
                        marginBottom: 16,
                        backgroundColor: theme.border,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ItemButton
                            title={'Dev Tools'}
                            onPress={() => navigation.navigate('DeveloperTools')}
                        />
                    </View>
                )}

                {isLedger ? (
                    <View style={{
                        marginBottom: 4,
                        backgroundColor: theme.border,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ItemButton
                            dangerZone
                            title={t('common.logout')}
                            onPress={() => ledgerContext.reset(true)}
                        />
                    </View>
                ) : (
                    <View style={{
                        marginBottom: 4,
                        backgroundColor: theme.border,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ItemButton
                            dangerZone
                            title={t('common.logout')}
                            onPress={() => navigation.navigate('Logout')}
                        />
                        <ItemButton
                            dangerZone
                            title={t('settings.deleteAccount')}
                            onPress={() => navigation.navigate('DeleteAccount')}
                        />
                    </View>
                )}
                <Pressable
                    onPress={onVersionTap}
                    style={{
                        bottom: 14,
                        flexShrink: 1,
                        alignSelf: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 20,
                        overflow: 'hidden',
                        marginTop: 36, marginBottom: 32,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                    }}
                >
                    <Image
                        style={{ height: 24, width: 24 }}
                        resizeMode={'contain'}
                        source={require('@assets/ic-more-version.png')}
                    />
                    <Text style={[{ color: theme.textPrimary, marginTop: 8 }, Typography.medium17_24]}>
                        {Application.applicationName}
                    </Text>
                    <Text
                        style={[{ color: theme.textSecondary, alignSelf: 'center' }, Typography.regular13_18]}
                    >
                        Version {Application.nativeApplicationVersion} {network.isTestnet ? `(${Application.nativeBuildVersion})` : ''}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
});