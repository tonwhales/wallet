import { memo, PropsWithChildren, useCallback, useEffect } from "react"
import { WithDelay } from "./WithDelay"
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated"
import { LayoutChangeEvent } from "react-native"
import { TimingConfig } from "@shopify/react-native-skia/lib/typescript/src/animation/types"

const timingConfig = (noAnimation?: boolean): TimingConfig => ({ duration: noAnimation ? 0 : 300, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) })

export const SimpleTransferAnimatedWrapper = memo(({ scrollOffsetSv, delay = 0, isActive, children, noAnimation }: PropsWithChildren<{
    isActive: boolean | null
    scrollOffsetSv: SharedValue<number>
    noAnimation?: boolean
    delay?: number
}>) => {  
    const animvSV = useSharedValue(0)
    const offsetSv = useSharedValue(0)
    const onLayout = useCallback((e: LayoutChangeEvent) => {
        offsetSv.value = e.nativeEvent?.layout.y
    }, [])

    const min = useDerivedValue(() => 0);
    const max = useDerivedValue(() => - offsetSv.value + scrollOffsetSv.value);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(animvSV.value, [0, 1], [0, 1], Extrapolation.CLAMP),
        pointerEvents: animvSV.value === 0 ? 'none' : 'auto',
        transform: [
            {
                translateY: interpolate(
                    animvSV.value, [0, 1, 2],
                    [min.value, 0, max.value],
                    Extrapolation.CLAMP
                )
            }
        ]
    }), [])

    useEffect(() => {
        if (isActive === null) {
            animvSV.value = withTiming(1, timingConfig(noAnimation))
        } else if (isActive) {
            animvSV.value = withTiming(2, timingConfig(noAnimation))
        } else {
            animvSV.value = withTiming(0, timingConfig(noAnimation))
        }
    }, [isActive])

    return (
        <WithDelay delay={delay}>
            <Animated.View style={animatedStyle} onLayout={onLayout}>
                {children}
            </Animated.View>
        </WithDelay>
    )
})