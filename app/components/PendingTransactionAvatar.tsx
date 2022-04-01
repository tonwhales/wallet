import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { Theme } from "../Theme"
import { avatarHash } from "../utils/avatarHash";
import { Avatar, avatarColors, avatarImages } from "./Avatar";
const Color = require('color');

export const PendingTransactionProgress = React.memo(({
    style,
    avatarId
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string
}) => {
    const ref = useRef<AnimatedCircularProgress>(null);
    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];
    let Img = avatarImages[avatarHash(avatarId, avatarImages.length)];
    const [colors, setColors] = useState({
        backgroundColor: Color(color).lighten(0.5).hex(),
        tintColor: Color(color).lighten(0.1).hex()
    })

    useEffect(() => {
        const timerId = setInterval(() => {
            if (colors.tintColor === Color(color).lighten(0.1).hex()) {
                setColors({
                    tintColor: Color(color).lighten(0.5).hex(),
                    backgroundColor: Color(color).lighten(0.1).hex()
                });
            } else {
                setColors({
                    tintColor: Color(color).lighten(0.1).hex(),
                    backgroundColor: Color(color).lighten(0.5).hex()
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