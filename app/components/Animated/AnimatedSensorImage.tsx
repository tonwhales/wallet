import React from "react";
import { Dimensions, ImageSourcePropType, Image } from "react-native";
import Animated, {
    interpolate,
    SensorType,
    useAnimatedSensor,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

export const AnimatedSensorImage = React.memo(({
    source,
    layer,
    width,
    height,
    xInput,
    xOutput,
    yInput,
    yOutput,
    zIndexOutput,
    xDistanceScale = 0.1,
    yDistanceScale = 0.1,
    top, bottom, left, right
}: {
    source: ImageSourcePropType,
    layer: number,
    width: number,
    height: number,
    xInput?: number[],
    xOutput?: number[],
    yInput?: number[],
    yOutput?: number[],
    zIndexOutput?: number[],
    xDistanceScale?: number,
    yDistanceScale?: number,
    top?: number, bottom?: number, left?: number, right?: number
}) => {
    const scaleWidth = Dimensions.get("window").width;
    const animatedSensor = useAnimatedSensor(SensorType.ROTATION, {
        interval: 10,
    });

    const animatedStyles = useAnimatedStyle(() => {
        const { qw, qx, qy } = animatedSensor.sensor.value;

        const translateX = interpolate(
            -qy,
            xInput ?? [-1, -0.5, 0, 0.5, 1],
            xOutput ?? [1, 1, 0, -1, -1]
        );

        const translateY = interpolate(
            -qx,
            yInput ?? [-0.5, 0, 0.5, 1, 1.5],
            yOutput ?? [1, 1, 0, -1, -1]
        );

        const zIndex = zIndexOutput ? layer + zIndexOutput[qw > 0 ? 0 : 1] : layer;

        return {
            zIndex,
            transform: [
                { translateX: withSpring(translateX * scaleWidth * xDistanceScale) },
                { translateY: withSpring(translateY * scaleWidth * yDistanceScale) },
            ],
        };
    });

    return (
        <Animated.View style={[{ position: "absolute", top, bottom, left, right }, animatedStyles]}>
            <Image style={{ width, height }} source={source} />
        </Animated.View>
    );
});