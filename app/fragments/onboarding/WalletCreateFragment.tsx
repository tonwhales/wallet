import * as React from 'react';
import { Platform, View, Text, ToastAndroid, Alert, ScrollView } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import Animated, { FadeIn, FadeOutDown, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { WalletSecurePasscodeComponent } from '../../components/secure/WalletSecurePasscodeComponent';
import { useParams } from '../../utils/useParams';
import { MnemonicsView } from '../../components/MnemonicsView';
import { RoundButton } from '../../components/RoundButton';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { warn } from '../../utils/log';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { HeaderBackButton } from "@react-navigation/elements";
import * as ScreenCapture from 'expo-screen-capture';

export const WalletCreateFragment = systemFragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { mnemonics } = useParams<{ mnemonics?: string }>();
    const [state, setState] = useState<{ mnemonics: string, saved?: boolean } | null>(null);

    useEffect(() => {
        if (mnemonics) {
            setState({ mnemonics });
            return;
        }
        (async () => {
            // Nice minimum delay for smooth animations
            // and secure feeling of key generation process
            // It is a little bit random - sometimes it takes few seconds, sometimes few milliseconds
            const mnemonics = await mnemonicNew();

            // Persist state
            setState({ mnemonics: mnemonics.join(' ') });
        })()
    }, []);

    const onBack = useCallback((e: any) => {
        if (state?.saved) {
            e.preventDefault();
            setState({ ...state, saved: false });
            return;
        }

        navigation.base.dispatch(e.data.action);
    }, [state, navigation]);

    useLayoutEffect(() => {

        let subscription: ScreenCapture.Subscription;
        subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigate('ScreenCapture');
        });

        if (Platform.OS === 'android') {
            navigation.base.addListener('beforeRemove', onBack);
        }
        if (Platform.OS === 'ios') {
            navigation.base.setOptions({
                gestureEnabled: !state?.saved,
                headerLeft: () => {
                    return (
                        <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            style={{ marginLeft: -13 }}
                            onPress={() => {
                                if (state?.saved) {
                                    setState({ ...state, saved: false });
                                } else {
                                    navigation.goBack();
                                }
                            }}
                            tintColor={Theme.accent}
                        />
                    )
                },
            });
        }

        return () => {
            subscription?.remove();
            if (Platform.OS === 'android') {
                navigation.base.removeListener('beforeRemove', onBack);
            }
            if (Platform.OS === 'ios') {
                navigation.base.setOptions({
                    headerLeft: () => {
                        return (
                            <HeaderBackButton
                                style={{ marginLeft: -13 }}
                                label={t('common.back')}
                                labelVisible
                                onPress={navigation.goBack}
                                tintColor={Theme.accent}
                            />
                        )
                    },
                });
            }
        }
    }, [navigation, onBack, state]);

    return (
        <View
            style={{
                flex: 1,
                flexGrow: 1,
                paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 16 : safeArea.bottom) : 0
            }}
        >
            <StatusBar style={'dark'} />
            {!state && (
                <Animated.View
                    style={{
                        flexGrow: 1, backgroundColor: Theme.surfacePimary,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                    }}
                    key={'loading'}
                    exiting={FadeOutDown}
                >
                    <AndroidToolbar />
                    <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                        <View style={{ flexGrow: 1 }} />
                        <FragmentMediaContent
                            animation={require('../../../assets/animations/clock.json')}
                            title={t('create.inProgress')}
                        />
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </Animated.View>
            )}
            {state && !state?.saved && (
                <>
                    <AndroidToolbar />
                    <ScrollView
                        alwaysBounceVertical={false}
                        style={{ flexGrow: 1, width: '100%', paddingHorizontal: 16 }}
                        contentInset={{ bottom: safeArea.bottom + 56 + 16 }}
                    >
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: Theme.textPrimary,
                            marginBottom: 12, marginTop: 16
                        }}>
                            {t('create.backupTitle')}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: Theme.textSecondary,
                            marginBottom: 16
                        }}>
                            {t('create.backupSubtitle')}
                        </Text>
                        <MnemonicsView mnemonics={state.mnemonics} />
                        {AppConfig.isTestnet && (
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
                        <View style={{ height: 56 + 16 }} />
                    </ScrollView>
                    <View style={{
                        justifyContent: 'flex-end',
                        padding: 16,
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        paddingBottom: Platform.OS === 'ios' ? safeArea.bottom === 0 ? 56 : safeArea.bottom + 56 : undefined,
                    }}>
                        <RoundButton
                            title={t('create.okSaved')}
                            onPress={() => {
                                setState({ ...state, saved: true });
                            }}
                        />
                    </View>
                </>
            )}
            {state?.saved && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center',
                        flexGrow: 1, backgroundColor: Theme.surfacePimary,
                    }}
                    key={"content"}
                    entering={FadeIn}
                    exiting={FadeOutRight}
                >
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={false}
                        onBack={() => setState({ ...state, saved: false })}
                    />
                </Animated.View>
            )}
        </View>
    );
});