import { memo } from "react";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "../../../engine/hooks";
import { View } from "react-native";

const DURATION = 400;
const DELAY = 800;
const easing = Easing.inOut(Easing.linear);

function positionFn(value: number): { x: number, y: number } {
    'worklet';
    if (value >= 0 && value <= 1) {
        return { x: value * 96, y: 0 };
    } else if (value > 1 && value <= 2) {
        return { x: 96, y: (value - 1) * 62 };
    } else if (value >= 2 && value <= 3) {
        return { x: 96 - (value - 2) * 96, y: 62 };
    } else if (value >= 3 && value < 4) {
        return { x: 0, y: 62 - (value - 3) * 62 };
    }

    return { x: 0, y: 0 };
}

export const AnimatedCards = memo(() => {
    const theme = useTheme();

    const position = useSharedValue(0);
    const card0Style = useAnimatedStyle(() => {
        const { x, y } = positionFn(position.value);

        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { rotate: `${position.value * 180}deg` }
            ]
        }
    });

    const card1Style = useAnimatedStyle(() => {
        const { x, y } = positionFn(position.value);

        return {
            transform: [
                { translateX: -x },
                { translateY: -y },
                { rotate: `${position.value * -180}deg` }
            ]
        }
    });

    position.value = withRepeat(
        withSequence(
            withDelay(
                DELAY,
                withTiming(1, { duration: DURATION, easing })
            ),
            withDelay(
                DELAY,
                withTiming(2, { duration: DURATION, easing })
            ),
            withDelay(
                DELAY,
                withTiming(3, { duration: DURATION, easing })
            ),
            withDelay(
                DELAY,
                withTiming(4, { duration: DURATION, easing })
            ),
            withTiming(0, { duration: 1 })
        ),
        Infinity,
        false
    );


    return (

        <Animated.View
            style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}
            entering={FadeIn}
            exiting={FadeOut}
        >
            <View style={{
                height: 160,
                width: 244,
                alignSelf: 'center'
            }}>
                <Animated.View
                    style={[
                        card0Style,
                        {
                            backgroundColor: theme.divider,
                            opacity: 0.5,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: 96,
                            width: 148,
                            borderRadius: 12
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        card1Style,
                        {
                            backgroundColor: theme.divider,
                            opacity: 0.5,
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            height: 96,
                            width: 148,
                            borderRadius: 12
                        }
                    ]}
                />
            </View>
        </Animated.View>
    );
});