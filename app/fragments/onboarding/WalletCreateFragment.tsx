import * as React from 'react';
import { Platform, View, Text, ToastAndroid, Alert, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOutDown, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { WalletSecurePasscodeComponent } from '../../components/secure/WalletSecurePasscodeComponent';
import { useParams } from '../../utils/useParams';
import { RoundButton } from '../../components/RoundButton';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { warn } from '../../utils/log';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import * as ScreenCapture from 'expo-screen-capture';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MnemonicsView } from '../../components/secure/MnemonicsView';
import { useNetwork, useTheme } from '../../engine/hooks';
import { mnemonicNew } from "@ton/crypto";
import { StatusBar } from 'expo-status-bar';

export const WalletCreateFragment = systemFragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { mnemonics, additionalWallet } = useParams<{ mnemonics?: string, additionalWallet?: boolean }>();
    const [state, setState] = useState<{ mnemonics: string, saved?: boolean } | null>(mnemonics ? { mnemonics } : null);

    useEffect(() => {
        if (!mnemonics) {
            (async () => {
                const mnemonics = await mnemonicNew();

                // Persist state
                setState({ mnemonics: mnemonics.join(' ') });
            })();
        }
    }, []);

    const onBack = useCallback((e: any) => {
        if (state?.saved) {
            e.preventDefault();
            setState({ ...state, saved: false });
            return;
        }

        navigation.base.dispatch(e.data.action);
    }, [state, navigation]);

    useEffect(() => {
        if (state) {
            ScreenCapture.preventScreenCaptureAsync('words-screen');
        } else {
            ScreenCapture.allowScreenCaptureAsync('words-screen');
        }
        return () => {
            ScreenCapture.allowScreenCaptureAsync('words-screen');
        }
    }, [state]);

    useLayoutEffect(() => {
        let subscription: ScreenCapture.Subscription;
        subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigateScreenCapture({
                callback: () => ScreenCapture.allowScreenCaptureAsync('words-screen')
            });
        });

        if (Platform.OS === 'android') {
            navigation.base.addListener('beforeRemove', onBack);
        }

        return () => {
            subscription?.remove();
            if (Platform.OS === 'android') {
                navigation.base.removeListener('beforeRemove', onBack);
            }
        }
    }, [navigation]);

    return (
        <View
            style={[
                { flexGrow: 1 },
                Platform.select({ android: { paddingBottom: safeArea.bottom + 16 } }),
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
                        <FragmentMediaContent
                            animation={require('@assets/animations/clock.json')}
                            title={t('create.inProgress')}
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
                        style={[{ paddingLeft: 16, paddingTop: safeArea.top }, Platform.select({ ios: { paddingTop: 32 } })]}
                    />
                    <ScrollView
                        alwaysBounceVertical={false}
                        style={{ width: '100%', paddingHorizontal: 16, }}
                        contentInset={{ bottom: safeArea.bottom + 16 + 56 }}
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
                        <MnemonicsView mnemonics={state.mnemonics} />
                        {isTestnet && (
                            <RoundButton
                                display={'text'}
                                title={t('create.copy')}
                                style={{ marginTop: 20 }}
                                onPress={() => {
                                    try {
                                        if (Platform.OS === 'android') {
                                            Clipboard.setString(state.mnemonics);
                                            ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
                                            return;
                                        }
                                        Clipboard.setString(state.mnemonics);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    } catch {
                                        warn('Failed to copy words');
                                        Alert.alert(t('common.error'), t('errors.unknown'));
                                        return;
                                    }
                                }}
                            />
                        )}
                    </ScrollView>
                    <View style={[
                        { paddingHorizontal: 16 },
                        Platform.select({ android: { paddingBottom: 16 } })
                    ]}>
                        <RoundButton
                            title={t('create.okSaved')}
                            style={{ position: 'absolute', bottom: 0, left: 16, right: 16 }}
                            onPress={() => {
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
                        onBack={() => setState({ ...state, saved: false })}
                    />
                </Animated.View>
            )}
        </View>
    );
});