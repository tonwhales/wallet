import * as React from 'react';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Platform, Text, View } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import { minimumDelay } from 'teslabot';
import { WalletSecureFragment } from './WalletSecureFragment';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { DeviceEncryption, getDeviceEncryption } from '../../utils/getDeviceEncryption';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from '../../components/AndroidToolbar';

export const WalletCreateFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<{
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    } | null>(null);
    React.useEffect(() => {
        (async () => {

            // Nice minimum delay for smooth animations
            // and secure feeling of key generation process
            // It is a little bit random - sometimes it takes few seconds, sometimes few milliseconds
            const mnemonics = await minimumDelay(2500, (async () => {
                return await mnemonicNew();
            })());

            // Fetch enrolled security
            const encryption = await getDeviceEncryption();

            // Persist state
            setState({ mnemonics: mnemonics.join(' '), deviceEncryption: encryption });
        })()
    }, []);

    return (
        <>
            {!state && (
                <Animated.View
                    style={{
                        flexGrow: 1, backgroundColor: 'white',
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0
                    }}
                    key="loading"
                    exiting={FadeOutDown}
                >
                    <AndroidToolbar />
                    <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                        <LoadingIndicator />
                        <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>{t("Creating secure wallet...")}</Text>
                    </View>
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center',
                        flexGrow: 1, backgroundColor: 'white',
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0
                    }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecureFragment
                        mnemonics={state.mnemonics}
                        deviceEncryption={state.deviceEncryption}
                        import={false}
                    />
                </Animated.View>
            )}
        </>
    );
});