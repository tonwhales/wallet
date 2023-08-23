import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert, ToastAndroid } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { getAppState, getBackup, markAddressSecured } from '../../storage/appState';
import { t } from '../../i18n/t';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEngine } from '../../engine/Engine';
import { systemFragment } from '../../systemFragment';
import { useRoute } from '@react-navigation/native';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useReboot } from '../../utils/RebootContext';
import { warn } from '../../utils/log';
import { MnemonicsView } from '../../components/MnemonicsView';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useScreenHeader } from '../../components/ScreenHeader';
import { Avatar } from '../../components/Avatar';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export const WalletBackupFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const init = route.name === 'WalletBackupInit';
    const reboot = useReboot();
    const back = route.params && (route.params as any).back === true;
    const [mnemonics, setMnemonics] = useState<string[] | null>(null);
    const address = useMemo(() => getBackup(), []);
    const engine = useEngine();
    const authContext = useKeysAuth();

    const onComplete = useCallback(() => {
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address, AppConfig.isTestnet);
        if (back) {
            navigation.goBack();
        } else {
            if (init) {
                reboot();
            }

            navigation.navigateAndReplaceAll('Home');
        }
    }, [engine]);

    useEffect(() => {
        (async () => {
            try {
                let keys = await authContext.authenticate({ backgroundColor: Theme.item, cancelable: false });
                setMnemonics(keys.mnemonics);
            } catch {
                navigation.goBack();
                return;
            }
        })();

        // Keeping screen in awakened state
        activateKeepAwakeAsync('WalletBackupFragment');
        return function deactivate() {
            deactivateKeepAwake('WalletBackupFragment')
        };
    }, []);

    useScreenHeader(
        navigation,
        Theme,
        {
            title: t('create.backupTitle'),
            headerShown: true,
            tintColor: Theme.accent,
        }
    );

    useEffect(() => {
        let subscription: ScreenCapture.Subscription;
        subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigate('ScreenCapture');
        });
        return () => {
            subscription?.remove();
        };
    }, []);

    if (!mnemonics) {
        return null;
    }

    return (
        <Animated.View
            style={{
                alignItems: 'center', justifyContent: 'center',
                flexGrow: 1,
                backgroundColor: Theme.item,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 16 : safeArea.bottom + 32) : 0,
            }}
            exiting={FadeIn}
            key={"content"}
        >
            <StatusBar style={'dark'} />
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
                            color: Theme.textColor,
                            marginBottom: 12, marginTop: 16
                        }}>
                            {t('create.backupTitle')}
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            flexShrink: 1,
                            color: Theme.darkGrey,
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
                            paddingTop: init ? 0 : 46,
                        }}
                    />
                    {!init && (
                        <View style={{
                            borderRadius: 34,
                            height: 68, width: 68,
                            backgroundColor: Theme.lightGrey,
                            justifyContent: 'center', alignItems: 'center',
                            position: 'absolute', top: -34, alignSelf: 'center'
                        }}>
                            <Avatar
                                id={address.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                size={77}
                                borderColor={Theme.lightGrey}
                                borderWith={3}
                            />
                        </View>
                    )}
                </View>
                {AppConfig.isTestnet && (
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
                        color: Theme.darkGrey,
                        marginTop: 24
                    }}>
                        {t('create.backupSubtitle')}
                    </Text>
                )}
            </ScrollView>
            <View style={{
                alignSelf: 'stretch',
                paddingHorizontal: 16,
                paddingVertical: 16,
                marginBottom: init ? safeArea.bottom === 0 ? 16 : safeArea.bottom : 0
            }}>
                <RoundButton title={back ? t('common.done') : t('common.continue')} onPress={onComplete} />
            </View>
        </Animated.View>
    );
});