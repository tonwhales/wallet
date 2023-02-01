import React from "react";
import { View, Image } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import Animated, { EasingNode } from "react-native-reanimated";

export const Splash = React.memo(({ hide }: { hide: boolean }) => {
    const [visible, setVisible] = React.useState(true);
    const splashOpacity = React.useMemo(() => new Animated.Value<number>(1), []);

    React.useEffect(() => {
        if (hide) {
            Animated.timing(splashOpacity, {
                toValue: 1,
                duration: 1,
                easing: EasingNode.linear
            }).start(() => {
                // Hide native splash screen only after we insure that
                // our splash screen is rendered
                try { // Just in case Native Slash is already hidden
                    SplashScreen.hideAsync();
                } catch (error) {
                    // ignore
                }
                Animated.timing(splashOpacity, {
                    toValue: 0,
                    duration: 350,
                    easing: EasingNode.linear
                }).start(() => setVisible(false));
            });
        }
    }, [hide]);

    if (!visible) return null;

    return (
        <Animated.View
            key="splash"
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: splashOpacity as any,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
            }}
            pointerEvents={'none'}
        >
            <View style={{
                width: 256, height: 416,
                alignItems: 'center'
            }}>
                <Image
                    style={{ width: 256, height: 256 }}
                    source={require('../../assets/splash_icon.png')}
                />
            </View>
        </Animated.View>
    );
});