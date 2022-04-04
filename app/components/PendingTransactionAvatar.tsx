import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { Theme } from "../Theme"
import { addAlpha } from "../utils/addAlpha";
import { avatarHash } from "../utils/avatarHash";
import { shadeColor } from "../utils/shadeColor";
import { Avatar, avatarColors, avatarImages, KnownWallets } from "./Avatar";
import Staking_ava from '../../assets/images/Staking_ava.svg';

export const PendingTransactionAvatar = React.memo(({
    style,
    avatarId,
    address,
    staking
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string,
    address?: string,
    staking?: boolean
}) => {
    const ref = useRef<AnimatedCircularProgress>(null);

    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];
    let Img = avatarImages[avatarHash(avatarId, avatarImages.length)];
    
    let known = address ? KnownWallets[address] : undefined;
    if (known) {
        if (known.ic) Img = known.ic;
        if (known.color) color = known.color
    }

    let lighter = shadeColor(color, 20);
    let darker = shadeColor(color, -5)

    if (staking) {
        Img = Staking_ava;
        lighter = shadeColor(color, 20);
        darker = Theme.accent;
        lighter = '#DEEFFC';
    }

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
            <View style={{ width: 39, height: 39, borderRadius: 39, backgroundColor: staking ? '#F6FBFF' : color }} />
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