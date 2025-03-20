import React, { memo, useCallback, useEffect, useState } from "react";
import { View, Image, Platform } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { useTheme } from "../engine/hooks";
import { changeNavBarColor } from "../modules/NavBar";

export const Splash = memo(({ hide }: { hide: boolean }) => {
    const theme = useTheme();
    const [visible, setVisible] = useState(true);
    const sharedOpacity = useSharedValue(1);

    const onStarted = useCallback(() => {
        setTimeout(() => {
            SplashScreen.hideAsync();
        }, 100)
    }, []);

    useEffect(() => {
        if (Platform.OS === 'android' && hide) {
            onStarted();
            return;
        }
        if (hide && visible) {
            sharedOpacity.value = withTiming(
                0.99,
                { duration: 100 },
                (finished, _) => {
                    if (finished) {
                        runOnJS(onStarted)();
                        sharedOpacity.value = withTiming(0, { duration: 350 }, (finished, _) => {
                            if (finished) {
                                runOnJS(setVisible)(false);
                                // setVisible(false);
                            }
                        });
                    }
                }
            );
        }
    }, [hide]);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: sharedOpacity.value };
    });

    // TODO: remove this Splash component completely
    // in the meantime, hide splash screen on android
    if (Platform.OS === 'android') {
        return null;
    }

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
                    backgroundColor: theme.backgroundPrimary,
                },
                animatedStyle
            ]}
            pointerEvents={'none'}
        >
            <View style={{
                width: 147, height: 175,
                alignItems: 'center'
            }}>
                <Image
                    style={{ width: 147, height: 175 }}
                    source={theme.style === 'dark' ? require('@assets/ic-splash-dark.png') : require('@assets/ic-splash.png')}
                />
            </View>
        </Animated.View>
    );
});