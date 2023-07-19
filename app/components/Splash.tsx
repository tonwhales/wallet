import React, { useEffect } from "react";
import { View, Image } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

export const Splash = React.memo(({ hide }: { hide: boolean }) => {
    const [visible, setVisible] = React.useState(true);
    const sharedOpacity = useSharedValue(1);

    useEffect(() => {
        if (hide && visible) {
            sharedOpacity.value = withTiming(
                0.1,
                {},
                (finished, _) => {
                    if (finished) {
                        runOnJS(SplashScreen.hideAsync)();
                        sharedOpacity.value = withTiming(0, { duration: 500 }, (finished, _) => {
                            runOnJS(setVisible)(false);
                        });
                    }
                }
            );
        }
    }, [hide]);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: sharedOpacity.value };
    });

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            key="splash"
            style={[
                {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                },
                animatedStyle
            ]}
            pointerEvents={'none'}
        >
            <StatusBar style={'dark'} />
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