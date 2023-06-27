import * as React from 'react';
import { Platform, View } from 'react-native';
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

export const WalletCreateFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<{ mnemonics: string } | null>(null);
    React.useEffect(() => {
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
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={false}
                    />
                </Animated.View>
            )}
        </View>
    );
});