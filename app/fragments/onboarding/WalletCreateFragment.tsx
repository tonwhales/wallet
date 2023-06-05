import * as React from 'react';
import { Platform, View } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import { minimumDelay } from 'teslabot';
import { WalletSecureFragment } from './WalletSecureFragment';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useParams } from '../../utils/useParams';

export const WalletCreateFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const { additionalWallet } = useParams<{ additionalWallet?: boolean }>();
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
        <View
            style={{
                flexGrow: 1,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 0) + 16 : 0,
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
            {state && (
                <Animated.View
                    style={{
                        alignItems: 'center', justifyContent: 'center',
                        flexGrow: 1, backgroundColor: Theme.item,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0
                    }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecureFragment
                        mnemonics={state.mnemonics}
                        deviceEncryption={state.deviceEncryption}
                        import={false}
                        additionalWallet={additionalWallet}
                    />
                </Animated.View>
            )}
        </View>
    );
});