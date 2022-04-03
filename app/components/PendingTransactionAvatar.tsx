import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { Theme } from "../Theme"
import { addAlpha } from "../utils/addAlpha";
import { avatarHash } from "../utils/avatarHash";
import { shadeColor } from "../utils/shadeColor";
import { Avatar, avatarColors, avatarImages } from "./Avatar";

export const PendingTransactionAvatar = React.memo(({
    style,
    avatarId
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string
}) => {
    const ref = useRef<AnimatedCircularProgress>(null);
    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];
    let Img = avatarImages[avatarHash(avatarId, avatarImages.length)];
    const lighter = shadeColor(color, 10);
    const darker = shadeColor(color, -1)
    const [colors, setColors] = useState({
        tintColor: darker,
        backgroundColor: lighter
    });

    useEffect(() => {
        const timerId = setInterval(() => {
            if (colors.tintColor === darker) {
                setColors({
                    tintColor: lighter,
                    backgroundColor: darker
                });
            } else {
                setColors({
                    tintColor: darker,
                    backgroundColor: lighter
                });
            }
            ref.current?.reAnimate(0, 100, 6000);
        }, 6000, 6000);

        return () => {
            clearInterval(timerId);
        }
    }, []);


    return (
        <View style={{ flex: 1, height: 42, width: 42, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 39, height: 39, borderRadius: 39, backgroundColor: color }} />
            <View style={{
                position: 'absolute',
                top: 0, left: 0,
                right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Img
                    width={Math.floor(42 * 0.7)}
                    height={Math.floor(42 * 0.7)}
                    color="white"
                />
            </View>
            <AnimatedCircularProgress
                ref={ref}
                size={42}
                width={3}
                fill={100}
                tintColor={colors.tintColor}
                backgroundColor={colors.backgroundColor}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    right: 0, bottom: 0
                }}
                duration={6000}
                rotation={0}
                lineCap={'round'}
            />
        </View>
    )
})