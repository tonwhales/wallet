import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { Theme } from "../Theme"
import { avatarHash } from "../utils/avatarHash";
import { avatarColors, avatarImages, KnownWallets } from "./Avatar";
import { AppConfig } from "../AppConfig";
const Color = require('color');

export const PendingTransactionAvatar = React.memo(({
    style,
    avatarId,
    address
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string,
    address?: string
}) => {
    const ref = useRef<AnimatedCircularProgress>(null);

    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];
    let Img = avatarImages[avatarHash(avatarId, avatarImages.length)];

    let size = Math.floor(42 * 0.6);
    let known = address ? KnownWallets[address] : undefined;
    if (known) {
        if (known.ic) Img = known.ic;
        if (known.color) color = known.color
    }

    let lighter = Color(color).lighten(0.2).hex();
    let darker = Color(color).darken(0.2).hex();

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
    }, [colors]);


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
                    width={size}
                    height={size}
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