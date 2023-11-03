import React, { useCallback, useEffect } from "react";
import { View, Image } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../engine/hooks/theme/useTheme";

export const Splash = React.memo(({ hide }: { hide: boolean }) => {
    const [visible, setVisible] = React.useState(true);
    const theme = useTheme();
    const sharedOpacity = useSharedValue(1);

    const onStarted = useCallback(() => {
        SplashScreen.hideAsync();
        setVisible(false);
    }, []);

    useEffect(() => {
        if (hide && visible) {
            sharedOpacity.value = withTiming(
                0.99,
                { duration: 100 },
                (finished, _) => {
                    if (finished) {
                        runOnJS(onStarted)();
                        sharedOpacity.value = withTiming(0, { duration: 500 });
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
                    backgroundColor: theme.background,
                },
                animatedStyle
            ]}
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