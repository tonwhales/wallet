import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, useWindowDimensions, ScrollView, Alert, ToastAndroid } from 'react-native';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
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
import { ScreenHeader } from '../../components/ScreenHeader';
import { Avatar } from '../../components/Avatar';
import { StatusBar } from 'expo-status-bar';

export const WalletBackupFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const init = route.name === 'WalletBackupInit';
    const reboot = useReboot();
    const back = route.params && (route.params as any).back === true;
    const [mnemonics, setMnemonics] = React.useState<string[] | null>(null);
    const address = React.useMemo(() => getBackup(), []);
    const engine = useEngine();
    const authContext = useKeysAuth();
    const onComplete = React.useCallback(() => {
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
    React.useEffect(() => {
        (async () => {
            try {
                let keys = await authContext.authenticate({ backgroundColor: Theme.item, cancelable: !init });
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
    if (!mnemonics) {
        return (
            <Animated.View
                style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: Theme.item }}
                exiting={FadeOutDown}
                key={"loader"}
            >
                <ActivityIndicator color={Theme.loader} />
            </Animated.View>
        )
    }

    return (
        <Animated.View
            style={{
                alignItems: 'center', justifyContent: 'center',
                flexGrow: 1,
                backgroundColor: Theme.item,
                paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 0) : 0,
            }}
            exiting={FadeIn}
            key={"content"}
        >
            <StatusBar style={Platform.OS === 'ios' ? init ? 'dark' : 'light' : 'dark'} />
            {!init && (
                <ScreenHeader
                    title={t('create.backupTitle')}
                    onBackPressed={navigation.goBack}
                />
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
                <View style={{ marginTop: init ? 0 : 40 }}>
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
                                size={65}
                                borderColor={Theme.accent}
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