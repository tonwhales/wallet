import React from "react";
import { View, Text, Platform } from "react-native";
import LottieView from 'lottie-react-native';
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";

export const PasscodeSuccess = React.memo(({ title, onSuccess }: { title: string, onSuccess: () => void }) => {
    const { Theme } = useAppConfig();
    const animRef = React.useRef<LottieView>(null);

    React.useEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => animRef.current?.play(), 300);
        }
    }, []);

    return (
        <Animated.View
            style={{ justifyContent: 'center', alignItems: 'center' }}
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
                fontSize: 17, marginBottom: 16,
                color: Theme.success
            }}>
                {title}
            </Text>
        </Animated.View>
    );
});
