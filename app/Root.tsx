import * as React from 'react';
import { Navigation } from './Navigation';
import Animated, { Easing, EasingNode, FadeIn, FadeOut } from 'react-native-reanimated';
import { RecoilRoot } from 'recoil';
import { getAppState } from './storage/appState';
import * as SplashScreen from 'expo-splash-screen';
import { Theme } from './Theme';
import { View, Image, useWindowDimensions, Platform } from 'react-native';
import { BootContext } from './bootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from './components/AndroidToolbar';

const RebootContext = React.createContext<() => void>(() => { });
const IsTestnetContext = React.createContext(false);

export function useReboot() {
    return React.useContext(RebootContext);
}

export function useTestnet() {
    return React.useContext(IsTestnetContext);
}

export const Root = React.memo(() => {
    const [sessionId, setSessionId] = React.useState(0);
    const safeArea = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const reboot = React.useCallback(() => {
        setSessionId((s) => s + 1);
    }, [setSessionId]);
    const isTestnet = React.useMemo(() => {
        let r = getAppState();
        if (r) {
            return r.testnet;
        } else {
            return false;
        }
    }, [sessionId]);

    // Splash
    const [splashVisible, setSplashVisible] = React.useState(true);

    const splashOpacity = React.useMemo(() => {
        return new Animated.Value(1);
    }, [splashVisible]);

    const onMounted = React.useMemo(() => {
        return () => {
            if (!splashVisible) {
                SplashScreen.hideAsync();
                return;
            }
            Animated.timing(splashOpacity,
                {
                    toValue: 0,
                    duration: 200,
                    easing: EasingNode.ease
                }).start(() => {
                    setSplashVisible(false);
                });
            setTimeout(() => {
                SplashScreen.hideAsync();
            }, 30);
        }
    }, [splashVisible]);

    let splash = React.useMemo(() => (splashVisible && (
        <Animated.View
            key="splash"
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: splashOpacity,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
            }}
            pointerEvents={'none'}
        >
            <View style={{
                width: 256, height: 416,
                alignItems: 'center',
            }}>
                <Image style={{
                    width: 256, height: 256,
                }} source={require('../assets/splash_icon.png')} />
            </View>
        </Animated.View>
    )), [splashVisible, safeArea]);

    return (
        <BootContext.Provider value={onMounted}>
            <Animated.View
                key={'session-' + sessionId}
                style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'column', alignItems: 'stretch' }}
                exiting={FadeOut}
                entering={FadeIn}
            >
                <IsTestnetContext.Provider value={isTestnet}>
                    <RebootContext.Provider value={reboot}>
                        <RecoilRoot>
                            <Navigation />
                        </RecoilRoot>
                    </RebootContext.Provider>
                </IsTestnetContext.Provider>
            </Animated.View>
            {splash}
        </BootContext.Provider>
    );
});