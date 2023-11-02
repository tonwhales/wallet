import * as React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { fragment } from "../fragment";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletFragment } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { CachedLinking } from '../utils/CachedLinking';
import { resolveUrl } from '../utils/resolveUrl';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import * as SplashScreen from 'expo-splash-screen';
import { useGlobalLoader } from '../components/useGlobalLoader';
import { backoff } from '../utils/time';
import { useLinkNavigator } from "../useLinkNavigator";
import { getConnectionReferences } from '../storage/appState';
import { useTrackScreen } from '../analytics/mixpanel';
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { useTheme } from '../engine/hooks/useTheme';
import { useNetwork } from '../engine/hooks/useNetwork';
import { useCurrentJob } from '../engine/hooks/dapps/useCurrentJob';
import { warn } from '../utils/log';

export const HomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const [tab, setTab] = React.useState(0);
    const navigation = useTypedNavigation();
    const loader = useGlobalLoader()
    const linkNavigator = useLinkNavigator(isTestnet);
    let [currentJob, _] = useCurrentJob();

    // Subscribe for links
    React.useEffect(() => {
        return CachedLinking.setListener((link: string) => {
            if (link === '/job') {
                let canceller = loader.show();
                (async () => {
                    try {
                        await backoff('home', async () => {
                            let existing = currentJob;
                            if (!existing) {
                                return;
                            }

                            if (existing.job.type === 'transaction') {
                                try {
                                    SplashScreen.hideAsync();
                                } catch (e) {
                                    // Ignore
                                }
                                if (existing.job.payload) {
                                    navigation.navigateTransfer({
                                        order: {
                                            messages: [{
                                                target: existing.job.target.toString({ testOnly: isTestnet }),
                                                amount: existing.job.amount,
                                                amountAll: false,
                                                payload: existing.job.payload,
                                                stateInit: existing.job.stateInit,
                                            }]
                                        },
                                        text: existing.job.text,
                                        job: existing.jobRaw,
                                        callback: null
                                    });
                                } else {
                                    navigation.navigateSimpleTransfer({
                                        target: existing.job.target.toString({ testOnly: isTestnet }),
                                        comment: existing.job.text,
                                        amount: existing.job.amount,
                                        stateInit: existing.job.stateInit,
                                        job: existing.jobRaw,
                                        jetton: null,
                                        callback: null
                                    })
                                }
                            }
                            if (existing.job.type === 'sign') {
                                const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(existing!.key));
                                if (!connection) {
                                    return; // Just in case
                                }
                                navigation.navigateSign({
                                    text: existing.job.text,
                                    textCell: existing.job.textCell,
                                    payloadCell: existing.job.payloadCell,
                                    job: existing.jobRaw,
                                    callback: null,
                                    name: connection.name
                                });
                            }
                        });
                    } finally {
                        canceller();
                    }
                })()
            } else {
                let resolved = resolveUrl(link, isTestnet);
                if (resolved) {
                    try {
                        SplashScreen.hideAsync();
                    } catch (e) {
                        // Ignore
                    }
                    linkNavigator(resolved).catch((e) => warn('Failed to navigate: ' + e));
                }
            }
        });
    }, [currentJob]);

    if (tab === 0) {
        useTrackScreen('Wallet', isTestnet);
    } else if (tab === 1) {
        useTrackScreen('Transactions', isTestnet);
    } else if (tab === 2) {
        useTrackScreen('Settings', isTestnet);
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{ flexGrow: 1 }} />
            <StatusBar style={'dark'} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: tab === 0 ? 1 : 0 }} pointerEvents={tab === 0 ? 'box-none' : 'none'}>
                <WalletFragment />
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: tab === 1 ? 1 : 0 }} pointerEvents={tab === 1 ? 'box-none' : 'none'}>
                <TransactionsFragment />
            </View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: tab === 2 ? 1 : 0 }} pointerEvents={tab === 2 ? 'box-none' : 'none'}>
                <SettingsFragment />
            </View>
            <View style={{ height: 52 + safeArea.bottom, }}>
                {Platform.OS === 'ios' && (
                    <BlurView
                        style={{
                            height: 52 + safeArea.bottom,
                            paddingBottom: safeArea.bottom, paddingHorizontal: 16,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <View
                            style={{
                                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                                backgroundColor: theme.background,
                                opacity: 0.9
                            }}
                        />
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(0)}>
                            <Image
                                source={tab === 0 ? require('../../assets/ic_home_selected.png') : require('../../assets/ic_home.png')}
                                style={{ tintColor: tab === 0 ? theme.accent : theme.textSecondary }}
                            />
                            <Text
                                style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 0 ? theme.accent : theme.textSecondary }}
                            >
                                {t('home.wallet')}
                            </Text>
                        </Pressable>
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(1)}>
                            <Image
                                source={tab === 1 ? require('../../assets/ic_history_selected.png') : require('../../assets/ic_history.png')}
                                style={{ tintColor: tab === 1 ? theme.accent : theme.textSecondary }}
                            />
                            <Text
                                style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 1 ? theme.accent : theme.textSecondary }}
                            >
                                {t('transactions.history')}
                            </Text>
                        </Pressable>
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(2)}>
                            <Image
                                source={tab === 1 ? require('../../assets/ic_settings_selected.png') : require('../../assets/ic_settings.png')}
                                style={{ tintColor: tab === 2 ? theme.accent : theme.textSecondary }}
                            />
                            <Text
                                style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 2 ? theme.accent : theme.textSecondary }}
                            >
                                {t('home.settings')}
                            </Text>
                        </Pressable>
                    </BlurView>
                )}
                {Platform.OS === 'android' && (
                    <View style={{
                        height: 52 + safeArea.bottom,
                        paddingBottom: safeArea.bottom, paddingHorizontal: 16,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: theme.item
                    }}>
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(0)}>
                            <Image
                                source={tab === 0 ? require('../../assets/ic_wallet_selected.png') : require('../../assets/ic_wallet.png')}
                                style={{ tintColor: tab === 0 ? theme.accent : theme.textSecondary }}
                            />
                            <Text
                                style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 0 ? theme.accent : theme.textSecondary }}
                            >
                                {t('home.wallet')}
                            </Text>
                        </Pressable>
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(1)}>
                            <Image
                                source={tab === 1 ? require('../../assets/ic_history_selected.png') : require('../../assets/ic_history.png')}
                                style={{ tintColor: tab === 1 ? theme.accent : theme.textSecondary }}
                            />
                            <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 1 ? theme.accent : theme.textSecondary }}>
                                {t('transactions.history')}
                            </Text>
                        </Pressable>
                        <Pressable style={{ height: 52, flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }} onPress={() => setTab(2)}>
                            <Image
                                source={tab === 2 ? require('../../assets/ic_settings_selected.png') : require('../../assets/ic_settings.png')}
                                style={{ tintColor: tab === 2 ? theme.accent : theme.textSecondary }}
                            />
                            <Text style={{ fontSize: 10, fontWeight: '600', marginTop: 5, color: tab === 2 ? theme.accent : theme.textSecondary }}>
                                {t('home.settings')}
                            </Text>
                        </Pressable>
                    </View>
                )}
                <View
                    style={{
                        position: 'absolute',
                        top: 0.5, left: 0, right: 0,
                        height: 0.5,
                        width: '100%',
                        backgroundColor: theme.headerDivider,
                        opacity: 0.08
                    }}
                />
            </View>
        </View>
    );
}, true);