import * as React from 'react';
import { View, Text, Pressable, Image, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { openWithInApp } from '../utils/openWithInApp';
import { useCallback, useMemo } from 'react';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as StoreReview from 'expo-store-review';
import { ReAnimatedCircularProgress } from '../components/CircularProgress/ReAnimatedCircularProgress';
import { getAppState } from '../storage/appState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork, useOldWalletsBalances, usePrice, useSelectedAccount, useSyncState, useTheme, useThemeStyle } from '../engine/hooks';
import * as Application from 'expo-application';
import { ThemeStyle } from '../engine/state/theme';
import { useWalletSettings } from '../engine/hooks/appstate/useWalletSettings';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLedgerTransport } from './ledger/components/TransportContext';

import IcSecurity from '@assets/settings/ic-security.svg';
import IcSpam from '@assets/settings/ic-spam.svg';
import IcContacts from '@assets/settings/ic-contacts.svg';
import IcCurrency from '@assets/settings/ic-currency.svg';
import IcTerms from '@assets/settings/ic-terms.svg';
import IcPrivacy from '@assets/settings/ic-privacy.svg';
import IcSupport from '@assets/settings/ic-support.svg';
import IcTelegram from '@assets/settings/ic-tg.svg';
import IcRateApp from '@assets/settings/ic-rate-app.svg';
import IcNoConnection from '@assets/settings/ic-no-connection.svg';
import IcTheme from '@assets/settings/ic-theme.svg';

export const SettingsFragment = fragment(() => {
    const theme = useTheme();
    const [themeStyle,] = useThemeStyle();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const { showActionSheetWithOptions } = useActionSheet();
    const currentWalletIndex = getAppState().selected;
    const seleted = useSelectedAccount();
    const [walletSettings,] = useWalletSettings(seleted?.address);
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const syncState = useSyncState();
    const [, currency] = usePrice();

    // Ledger
    const route = useRoute();
    const isLedger = route.name === 'LedgerSettings';
    const ledgerContext = useLedgerTransport();

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

    const onRateApp = useCallback(async () => {
        if (await StoreReview.hasAction()) {
            StoreReview.requestReview();
        }
    }, []);

    const onSupport = useCallback(() => {
        const options = [t('common.cancel'), t('settings.support.telegram'), t('settings.support.form')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
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
    }, []);

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
                    })}
                    onPress={onAccountPress}
                >
                    <Text
                        style={{
                            fontWeight: '500',
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary, flexShrink: 1,
                            marginRight: 8
                        }}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {isLedger ? 'Ledger' : (walletSettings?.name || `${t('common.wallet')} ${currentWalletIndex + 1}`)}
                    </Text>
                    {syncState === 'updating' && (
                        <ReAnimatedCircularProgress
                            size={14}
                            color={theme.textThird}
                            reverse
                            infinitRotate
                            progress={0.8}
                        />
                    )}
                    {syncState === 'connecting' && (
                        <IcNoConnection
                            height={16}
                            width={16}
                            style={{ height: 16, width: 16 }}
                        />
                    )}
                    {syncState === 'online' && (
                        <View style={{ height: 16, width: 16, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: theme.accentGreen, width: 8, height: 8, borderRadius: 4 }} />
                        </View>
                    )}
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
                            onPress={() => ledgerContext.reset()}
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
                        borderRadius: 20,
                        overflow: 'hidden',
                        marginTop: 36, marginBottom: 32,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                    }}
                >
                    <Image
                        style={{
                            height: 48
                        }}
                        resizeMode={'contain'}
                        source={theme.style === ThemeStyle.Dark ? require('@assets/ic-splash-dark.png') : require('@assets/ic-splash.png')}
                    />
                    <Text
                        style={{
                            color: theme.textSecondary,
                            fontSize: 13,
                            lineHeight: 18,
                            fontWeight: '400',
                            alignSelf: 'center',
                        }}
                    >
                        v{Application.nativeApplicationVersion} {network.isTestnet ? `(${Application.nativeBuildVersion})` : ''}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}, true);