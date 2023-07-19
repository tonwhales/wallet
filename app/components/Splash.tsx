import React, { useEffect } from "react";
import { View, Image } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const Splash = React.memo(({ hide }: { hide: boolean }) => {
    const [visible, setVisible] = React.useState(true);
    const splashOpacity = useSharedValue(1);

    useEffect(() => {
        SplashScreen.hideAsync();
        if (hide) {
            splashOpacity.value = withTiming(0, { duration: 1300 });
        }
    }, [hide]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: splashOpacity.value,
        };
    });

    return (
        <Animated.View
            key="splash"
            style={[{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                // opacity: splashOpacity as any,
                justifyContent: 'center',
                alignItems: 'center',
                // backgroundColor: 'white',
                backgroundColor: 'red',
            }, animatedStyle]}
            pointerEvents={'none'}
        >
            {/* <StatusBar style={'dark'} /> */}
            <View style={{
                width: 147, height: 175,
                alignItems: 'center'
            }}>
                <Image
                    style={{ width: 147, height: 175 }}
                    source={require('../../assets/ic-splash.png')}
                />
            </View>
        </Animated.View>
    );
});