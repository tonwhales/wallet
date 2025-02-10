import { memo, PropsWithChildren } from 'react';
import Animated, { LinearTransition, Easing } from 'react-native-reanimated';
import { WithDelay } from './WithDelay';
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

type Props = {
    delay?: number
    style: StyleProp<ViewStyle>
    onLayout?: (e: LayoutChangeEvent) => void
}

export const AnimatedWrapper = memo((props: PropsWithChildren<Props>) => {
    return (
        <WithDelay delay={props.delay}>
            <Animated.View
                layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                style={props.style}
                onLayout={props.onLayout}
            >
                {props.children}
            </Animated.View>
        </WithDelay>
    )
})
