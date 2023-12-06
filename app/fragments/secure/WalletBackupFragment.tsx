import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert, ToastAndroid } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { getAppState, getBackup, markAddressSecured } from '../../storage/appState';
import { t } from '../../i18n/t';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { systemFragment } from '../../systemFragment';
import { useRoute } from '@react-navigation/native';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, useScreenHeader } from '../../components/ScreenHeader';
import { Avatar } from '../../components/Avatar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { useNetwork, useTheme } from '../../engine/hooks';
import { MnemonicsView } from '../../components/secure/MnemonicsView';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { StatusBar } from 'expo-status-bar';
import { useWalletSettings } from '../../engine/hooks/appstate/useWalletSettings';

export const WalletBackupFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const init = route.name === 'WalletBackupInit';
    const logout = route.name === 'WalletBackupLogout';
    const back = route.params && (route.params as any).back === true;
    const [mnemonics, setMnemonics] = useState<string[] | null>(null);
    const address = useMemo(() => getBackup(), []);
    const authContext = useKeysAuth();
    const toaster = useToaster();
    const [walletSettings, setSettings] = useWalletSettings(address.address);

    const onComplete = useCallback(() => {
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address);
        if (back) {
            navigation.goBack();
        } else {
            navigation.navigateAndReplaceAll('Home');
        }
    }, [address]);

    useEffect(() => {
        let subscription: ScreenCapture.Subscription;
        subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigateScreenCapture({
                callback: () => ScreenCapture.allowScreenCaptureAsync('words-screen')
            });
        });

        (async () => {
            try {
                let keys = await authContext.authenticate({
                    backgroundColor: theme.surfaceOnBg,
                    cancelable: true,
                    containerStyle: { paddingBottom: safeArea.bottom + 56 },
                });
                setMnemonics(keys.mnemonics);
            } catch {
                navigation.goBack();
                return;
            }
        })();

        return () => {
            subscription?.remove();
        };
    }, []);

    useScreenHeader(
        navigation,
        theme,
        {
            title: !init ? t('create.backupTitle') : '',
            headerShown: !logout,
            tintColor: theme.accent,
            onBackPressed: navigation.goBack
        }
    );

    if (!mnemonics) {
        return null;
    }

    return (
        <Animated.View
            style={{
                alignItems: 'center', justifyContent: 'center',
                flexGrow: 1,
                backgroundColor: !init ? undefined : theme.backgroundPrimary,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 56 + 32 : safeArea.bottom + 32) : 0,
            }}
            exiting={FadeIn}
            key={"content"}
        >
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: !init ? 'light' : theme.style === 'dark' ? 'light' : 'dark',
            })} />
            {logout ? (
                <ScreenHeader
                    title={t('common.logout')}
                    onBackPressed={navigation.goBack}
                    style={{ paddingHorizontal: 16 }}
                />
            ) : (
                !init && (
                    <ScreenHeader
                        title={t('create.backupTitle')}
                        onClosePressed={navigation.goBack}
                        style={Platform.select({ android: { paddingTop: safeArea.top } })}
                    />
                )
            )}
            <ScrollView
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                style={{ flexGrow: 1, width: '100%', paddingHorizontal: 16 }}
            >
                {init && (
                    <>
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: theme.textPrimary,
                            marginBottom: 12, marginTop: 16
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
                    </>
                )}
                <View style={{ marginTop: init ? 0 : 65 }}>
                    <MnemonicsView
                        mnemonics={mnemonics.join(' ')}
                        style={{
                            paddingTop: init ? 16 : 46,
                            backgroundColor: !init ? theme.surfaceOnElevation : undefined
                        }}
                        preventCapture={true}
                    />
                    {!init && (
                        <View style={{
                            borderRadius: 34,
                            height: 68, width: 68,
                            backgroundColor: theme.surfaceOnElevation,
                            justifyContent: 'center', alignItems: 'center',
                            position: 'absolute', top: -34, alignSelf: 'center'
                        }}>
                            <Avatar
                                id={address.address.toString({ testOnly: network.isTestnet })}
                                hash={walletSettings.avatar}
                                size={77}
                                borderColor={theme.elevation}
                                borderWith={3}
                                theme={theme}
                                isTestnet={network.isTestnet}
                            />
                        </View>
                    )}
                </View>
                {network.isTestnet && (
                    <RoundButton
                        display={'text'}
                        title={t('create.copy')}
                        style={{ marginTop: 20 }}
                        onPress={() => {
                            try {
                                if (Platform.OS === 'android') {
                                    Clipboard.setString(mnemonics.join(' '));
                                    ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
                                    return;
                                }
                                Clipboard.setString(mnemonics.join(' '));
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                toaster.show(
                                    {
                                        message: t('common.copied'),
                                        type: 'default',
                                        duration: ToastDuration.SHORT
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
                {!init && (
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400',
                        flexShrink: 1,
                        color: theme.textSecondary,
                        marginTop: 24
                    }}>
                        {t('create.backupSubtitle')}
                    </Text>
                )}
            </ScrollView>
            {init && (
                <View style={{
                    alignSelf: 'stretch',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom
                }}>
                    <RoundButton title={back ? t('common.done') : t('common.continue')} onPress={onComplete} />
                </View>
            )}
        </Animated.View>
    );
});