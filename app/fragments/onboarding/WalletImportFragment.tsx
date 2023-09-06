import * as React from 'react';
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import Animated, { FadeOutDown, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { systemFragment } from '../../systemFragment';
import { WalletWordsComponent } from '../../components/secure/WalletWordsComponent';
import { WalletSecurePasscodeComponent } from '../../components/secure/WalletSecurePasscodeComponent';
import { useTheme } from '../../engine/hooks/useTheme';


export const WalletImportFragment = systemFragment(() => {
    const theme = useTheme();
    const [state, setState] = React.useState<{
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    } | null>(null);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    React.useLayoutEffect(() => {
        if (!state) {
            navigation.setOptions({ headerStyle: { backgroundColor: theme.background } });
        } else {
            navigation.setOptions({ headerStyle: { backgroundColor: theme.item } });
        }
    }, [navigation, state]);

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
                        alignItems: 'center', justifyContent: 'center', flexGrow: 1,
                        paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
                        backgroundColor: Platform.OS === 'android' ? theme.background : undefined
                    }}
                    key="loading"
                    exiting={FadeOutDown}
                >
                    <AndroidToolbar style={{ backgroundColor: theme.background }} />
                    <WalletWordsComponent onComplete={setState} />
                </Animated.View>
            )}
            {state && (
                <Animated.View
                    style={{ alignItems: 'stretch', justifyContent: 'center', flexGrow: 1 }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecurePasscodeComponent
                        mnemonics={state.mnemonics}
                        import={true}
                    />
                </Animated.View>
            )}
        </View>
    );
});