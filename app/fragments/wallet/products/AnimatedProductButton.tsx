import React from "react";
import { Platform } from "react-native";
import Animated, { BaseAnimationBuilder, EntryExitAnimationFunction, EntryExitTransition } from "react-native-reanimated";
import { ProductButton, ProductButtonProps } from "./ProductButton";

export const AnimatedProductButton = React.memo((
    props: ProductButtonProps
        & {
            entering: BaseAnimationBuilder | typeof BaseAnimationBuilder,
            exiting: BaseAnimationBuilder | typeof BaseAnimationBuilder
        }
) => {

    if (Platform.OS === 'android') {
        return (
            <Animated.View entering={props.entering} exiting={props.exiting}>
                <ProductButton {...props} />
            </Animated.View>
        );
    }

    return <ProductButton {...props} />;
});