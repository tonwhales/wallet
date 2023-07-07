import * as React from 'react';
import { Platform, View, Text, ToastAndroid, Alert, ScrollView } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import { minimumDelay } from 'teslabot';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
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

export const WalletCreateFragment = systemFragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const { mnemonics } = useParams<{ mnemonics?: string }>();
    const [state, setState] = React.useState<{ mnemonics: string, saved?: boolean } | null>(null);
    React.useEffect(() => {
        if (mnemonics) {
            setState({ mnemonics });
            return;
        }
        (async () => {
            // Nice minimum delay for smooth animations
            // and secure feeling of key generation process
            // It is a little bit random - sometimes it takes few seconds, sometimes few milliseconds
            const mnemonics = await minimumDelay(2500, (async () => {
                return await mnemonicNew();
            })());

            // Persist state
            setState({ mnemonics: mnemonics.join(' ') });
        })()
    }, []);

    return (
        <View
            style={{
                flexGrow: 1,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 0) : 0,
            }}
        >
            {!state && (
                <Animated.View
                    style={{
                        flexGrow: 1, backgroundColor: Theme.item,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                    }}
                    key="loading"
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
                <ScrollView alwaysBounceVertical={false} style={{ paddingHorizontal: 16, flexGrow: 1 }}>
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
                    <View style={{
                        flexGrow: 1,
                        justifyContent: 'flex-end',
                        width: '100%',
                        paddingVertical: 16,
                        marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom
                    }}>
                        <RoundButton
                            title={t('create.okSaved')}
                            onPress={() => {
                                setState({ ...state, saved: true });
                            }}
                            style={{ height: 56 }}
                        />
                    </View>
                </ScrollView>
            )}
            {state?.saved && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center',
                        flexGrow: 1, backgroundColor: Theme.item,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0
                    }}
                    key={"content"}
                    entering={FadeIn}
                >
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={false}
                    />
                </Animated.View>
            )}
        </View>
    );
});