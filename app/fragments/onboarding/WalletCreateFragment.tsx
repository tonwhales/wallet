import * as React from 'react';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Text } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import { minimumDelay } from 'teslabot';
import { WalletSecureFragment } from './WalletSecureFragment';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { DeviceEncryption, getDeviceEncryption } from '../../utils/getDeviceEncryption';

export const WalletCreateFragment = fragment(() => {
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
                    style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
                    key="loading"
                    exiting={FadeOutDown}
                >
                    <LoadingIndicator />
                    <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>Creating secure wallet...</Text>
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecureFragment
                        mnemonics={state.mnemonics}
                        deviceEncryption={state.deviceEncryption}
                    />
                </Animated.View>
            )}
        </>
    );
});