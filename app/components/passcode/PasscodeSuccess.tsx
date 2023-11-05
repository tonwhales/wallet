import React, { memo, useEffect, useRef } from "react";
import { Text, Platform } from "react-native";
import LottieView from 'lottie-react-native';
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { useTheme } from '../../engine/hooks';

export const PasscodeSuccess = memo(({ title, onSuccess }: { title: string, onSuccess: () => void }) => {
    const theme = useTheme();
    const animRef = useRef<LottieView>(null);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => animRef.current?.play(), 300);
        }
    }, []);

    return (
        <Animated.View
            style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            exiting={SlideOutLeft}
            entering={SlideInRight}
        >
            <LottieView
                ref={animRef}
                source={require('../../../assets/animations/success.json')}
                autoPlay={true}
                loop={false}
                progress={0.2}
                style={{ width: 192, height: 192 }}
                onAnimationFinish={onSuccess}
            />
            <Text style={{
                fontWeight: '600',
                fontSize: 17, marginBottom: 160, marginTop: 16,
                color: theme.textPrimary
            }}>
                {title}
            </Text>
        </Animated.View>
    );
});
