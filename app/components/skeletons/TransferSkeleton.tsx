import React from "react";
import { memo, useEffect } from "react";
import Animated, { Easing, FadeIn, FadeOut, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { usePulsatingStyle } from "./usePulsatingStyle";
import { ItemGroup } from "../ItemGroup";
import { RoundButton } from "../RoundButton";
import { ASSET_ITEM_HEIGHT } from "../../utils/constants";

export const TransferSkeleton = memo(() => {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 700,
                    easing: Easing.linear
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = usePulsatingStyle(animation);

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
                {
                    width: '100%',
                    paddingHorizontal: 20,
                    marginTop: 4, flexGrow: 1
                },
            ]}
        >
            <Animated.View style={[{ flexGrow: 1 }, animatedStyles]}>
                <ItemGroup style={{ marginBottom: 16, marginTop: 20, height: 208 }}>

                </ItemGroup>
                <ItemGroup style={{ marginBottom: 14, height: 216 }}>

                </ItemGroup>
                <ItemGroup style={{ marginBottom: 16, height: ASSET_ITEM_HEIGHT }}>

                </ItemGroup>
            </Animated.View>
            <RoundButton
                disabled={true}
                loading={true}
                display={'secondary'}
            />
        </Animated.View>
    );
});