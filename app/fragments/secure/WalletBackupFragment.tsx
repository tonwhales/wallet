import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, useWindowDimensions, ScrollView } from 'react-native';
import { Theme } from '../../Theme';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { loadWalletKeys } from '../../storage/walletKeys';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { getAppState, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { t } from '../../i18n/t';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { EngineContext } from '../../sync/Engine';
import { systemFragment } from '../../systemFragment';
import { getDeviceEncryption } from '../../utils/getDeviceEncryption';
import { usePasscodeAuth } from '../../utils/PasscodeContext';
import { usePasscode } from '../../storage/secureStorage';

export const WalletBackupFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const navigation = useTypedNavigation();
    const [mnemonics, setMnemonics] = React.useState<string[] | null>(null);
    const address = React.useMemo(() => getCurrentAddress(), []);
    const engine = React.useContext(EngineContext)!
    const passcodeAuth = usePasscodeAuth();
    const onComplete = React.useCallback(() => {
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address);
        if (engine && !engine.ready) {
            navigation.navigateAndReplaceAll('Sync');
        } else {
            navigation.navigateAndReplaceAll('Home');
        }
    }, []);
    React.useEffect(() => {
        (async () => {
            try {
                let keys;
                const encryption = await getDeviceEncryption();
                const hasPasscode = usePasscode();
                if (Platform.OS === 'android' && encryption === 'passcode' && hasPasscode) {
                    keys = await passcodeAuth!.authenticateWithPasscodeAsync();
                } else {
                    keys = await loadWalletKeys(address.secretKeyEnc);
                }
                setMnemonics(keys.mnemonics);
            } catch (e) {
                navigation.goBack();
                return;
            }
        })();

        // Keeping screen in awakened state
        activateKeepAwake('WalletBackupFragment');
        return function deactivate() {
            deactivateKeepAwake('WalletBackupFragment')
        };
    }, []);
    if (!mnemonics) {
        return (
            <Animated.View
                style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: 'white' }}
                exiting={FadeOutDown}
                key={"loader"}
            >
                <ActivityIndicator color={Theme.loader} />
            </Animated.View>
        )
    }

    let words1: any[] = [];
    let words2: any[] = [];
    for (let i = 0; i < 24; i++) {
        const component = (
            <View key={'mn-' + i} style={{ flexDirection: 'row', marginBottom: height > 800 ? 16 : 12 }}>
                <Text style={{ textAlign: 'right', color: Theme.textSecondary, fontSize: 16, minWidth: 24, marginRight: 23, fontWeight: '400' }}>{(i + 1) + '. '}</Text>
                <Text style={{ color: Theme.textColor, fontSize: 16, fontWeight: '400' }}>{mnemonics[i]}</Text>
            </View>
        );
        if (i < 12) {
            words1.push(component);
        } else {
            words2.push(component);
        }
    }

    return (
        <Animated.View
            style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? safeArea.top : undefined, }}
            exiting={FadeIn}
            key={"content"}
        >
            <AndroidToolbar />
            <ScrollView alwaysBounceVertical={false} style={{ width: '100%' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 17 }}>{t('backup.title')}</Text>
                <Text style={{ textAlign: 'center', marginHorizontal: 16, marginTop: 11, fontSize: 16, color: '#6D6D71' }}>
                    {t('backup.subtitle')}
                </Text>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginHorizontal: 35,
                    marginTop: 35,
                    alignSelf: 'stretch',
                    paddingHorizontal: 10
                }}>
                    <View>
                        {words1}
                    </View>
                    <View>
                        {words2}
                    </View>
                </View>
                <View style={{ height: 64 + 16 + safeArea.bottom }} />
            </ScrollView>
            <View style={{ height: 64, marginTop: 33, alignSelf: 'stretch', position: 'absolute', bottom: safeArea.bottom, left: 16, right: 16 }}>
                <RoundButton title={t('common.continue')} onPress={onComplete} />
            </View>
        </Animated.View>
    );
});