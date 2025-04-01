import * as React from 'react';
import { View, Text, Pressable, Image, Platform, Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { openWithInApp } from '../utils/openWithInApp';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork, useBounceableWalletFormat, useOldWalletsBalances, usePrice, useSelectedAccount, useTheme, useThemeStyle, useHasHoldersProducts, useIsConnectAppReady, useLanguage, useSolanaSelectedAccount } from '../engine/hooks';
import * as Application from 'expo-application';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLedgerTransport } from './ledger/components/TransportContext';
import { Typography } from '../components/styles';
import { holdersUrl, HoldersUserState } from '../engine/api/holders/fetchUserState';
import { useHoldersAccountStatus } from '../engine/hooks/holders/useHoldersAccountStatus';
import { useHoldersAccounts } from '../engine/hooks/holders/useHoldersAccounts';
import { useIsHoldersInvited } from '../engine/hooks/holders/useIsHoldersInvited';
import { HoldersAppParamsType } from './holders/HoldersAppFragment';
import { lagnTitles } from '../i18n/i18n';
import { HoldersBannerType } from '../components/products/ProductsComponent';
import { HoldersBanner } from '../components/products/HoldersBanner';
import IcNewAddressFormat from '@assets/settings/ic-address-update.svg';
import { useAppMode } from '../engine/hooks/appstate/useAppMode';
import { SelectedWallet } from '../components/wallet/SelectedWallet';
import { useSupport } from '../engine/hooks/support/useSupport';

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

const iosStoreUrl = 'https://apps.apple.com/app/apple-store/id1607656232?action=write-review';
const androidStoreUrl = 'https://play.google.com/store/apps/details?id=com.tonhub.wallet&showAllReviews=true';

export const SettingsFragment = fragment(() => {
    const theme = useTheme();
    const [themeStyle] = useThemeStyle();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const selected = useSelectedAccount();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const [, currency] = usePrice();
    const [lang] = useLanguage();
    const [bounceableFormat] = useBounceableWalletFormat();
    const solanaAddress = useSolanaSelectedAccount()!;
    const hasHoldersProducts = useHasHoldersProducts(selected?.address.toString({ testOnly: network.isTestnet }) || '', solanaAddress);
    const inviteCheck = useIsHoldersInvited(selected?.address, network.isTestnet);
    const holdersAccStatus = useHoldersAccountStatus(selected?.address).data;
    const holdersAccounts = useHoldersAccounts(selected?.address).data;
    const url = holdersUrl(network.isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const route = useRoute();
    const isLedger = route.name === 'LedgerSettings';
    const showHoldersItem = !isLedger && hasHoldersProducts;
    const ledgerContext = useLedgerTransport();
    const [, switchAppToWalletMode] = useAppMode(selected?.address);
    const { onSupport } = useSupport({ isLedger });
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
        switchAppToWalletMode(false);
        navigation.navigateAndReplaceHome();
    }, [needsEnrollment, isHoldersReady, network.isTestnet, switchAppToWalletMode]);

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

    const onRateApp = async () => {
        const storeUrl = Platform.OS === 'android' ? androidStoreUrl : iosStoreUrl;
        Linking.openURL(storeUrl);
    };

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    return (
        <View style={{
            paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
            flexGrow: 1,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <View style={{
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 8,
                marginLeft: 16,
            }}>
                <SelectedWallet onLightBackground ledgerName={isLedger ? ledgerContext.ledgerName : undefined} />
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