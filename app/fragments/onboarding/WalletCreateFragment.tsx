import * as React from 'react';
import { Platform, View, Text, ToastAndroid, Alert, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOutDown, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { WalletSecurePasscodeComponent } from '../../components/secure/WalletSecurePasscodeComponent';
import { useParams } from '../../utils/useParams';
import { RoundButton } from '../../components/RoundButton';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { warn } from '../../utils/log';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import * as ScreenCapture from 'expo-screen-capture';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MnemonicsView } from '../../components/secure/MnemonicsView';
import { useNetwork, useTheme } from '../../engine/hooks';
import { mnemonicNew } from "@ton/crypto";
import { StatusBar } from 'expo-status-bar';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { AppsFlyerEvent } from '../../analytics/appsflyer';
import { trackAppsFlyerEvent } from '../../analytics/appsflyer';

export const WalletCreateFragment = systemFragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { mnemonics, additionalWallet, ledger } = useParams<{ mnemonics?: string, additionalWallet?: boolean, ledger?: boolean }>();
    const [state, setState] = useState<{ mnemonics: string, saved?: boolean } | null>(mnemonics ? { mnemonics } : null);
    const toaster = useToaster();

    useEffect(() => {
        if (!mnemonics) {
            (async () => {
                const mnemonics = await mnemonicNew();

                // Persist state
                setState({ mnemonics: mnemonics.join(' ') });
            })();
        }
    }, []);

    useLayoutEffect(() => {
        let subscription: ScreenCapture.Subscription;
        if (!state?.saved) {
            subscription = ScreenCapture.addScreenshotListener(() => {
                navigation.navigateScreenCapture();
            });
        }

        return () => {
            subscription?.remove();
        }
    }, [navigation, state]);

    return (
        <View
            style={[
                Platform.select({ android: { paddingBottom: safeArea.bottom + 16 } }),
                { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center' }
            ]}
        >
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            {!state && (
                <Animated.View
                    style={{
                        flexGrow: 1, backgroundColor: theme.backgroundPrimary,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                    }}
                    key={'loading'}
                    exiting={FadeOutDown}
                >
                    <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                        <View style={{ flexGrow: 1 }} />
                        <LoadingIndicator
                            simple
                            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                        />
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </Animated.View>
            )}
            {state && !state?.saved && (
                <View style={{ flexGrow: 1 }}>
                    <ScreenHeader
                        onBackPressed={() => {
                            if (state?.saved) {
                                setState({ ...state, saved: false });
                            } else {
                                navigation.goBack();
                            }
                        }}
                        style={[{ paddingTop: safeArea.top }, Platform.select({ ios: { paddingTop: 32 } })]}
                    />
                    <ScrollView
                        alwaysBounceVertical={false}
                        style={{ width: '100%', paddingHorizontal: 16, flexShrink: 1 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: theme.textPrimary,
                            marginBottom: 12
                        }}>
                            {t('create.backupTitle')}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: theme.textSecondary,
                            marginBottom: 16
                        }}>
                            {t('create.backupSubtitle')}
                        </Text>
                        <MnemonicsView
                            mnemonics={state.mnemonics}
                            preventCapture={true}
                        />
                        {isTestnet && (
                            <RoundButton
                                display={'text'}
                                title={t('create.copy')}
                                style={{ marginTop: 20 }}
                                onPress={() => {
                                    try {
                                        Clipboard.setString(state.mnemonics);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        toaster.show(
                                            {
                                                message: t('common.copied'),
                                                type: 'default',
                                                duration: ToastDuration.SHORT,
                                                marginBottom: Platform.select({ android: safeArea.bottom + 16 })
                                            }
                                        );
                                    } catch {
                                        warn('Failed to copy words');
                                        Alert.alert(t('common.error'), t('errors.unknown'));
                                        return;
                                    }
                                }}
                            />
                        )}
                    </ScrollView>
                    <View style={{ paddingHorizontal: 16 }}>
                        <RoundButton
                            title={t('create.okSaved')}
                            onPress={() => {
                                trackAppsFlyerEvent(AppsFlyerEvent.BackupPhraseConfirmed);
                                setState({ ...state, saved: true });
                            }}
                        />
                    </View>
                </View>
            )}
            {state?.saved && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center',
                        flexGrow: 1, backgroundColor: theme.backgroundPrimary,
                    }}
                    key={'content'}
                    entering={FadeIn}
                    exiting={FadeOutRight}
                >
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={false}
                        additionalWallet={additionalWallet}
                        ledger={ledger}
                        onBack={() => setState({ ...state, saved: false })}
                    />
                </Animated.View>
            )}
        </View>
    );
});