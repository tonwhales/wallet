import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { avatarHash } from "../utils/avatarHash";
import { avatarColors, avatarImages } from "./Avatar";
import { KnownWallets } from "../secure/KnownWallets";
import { KnownAvatar } from "./KnownAvatar";
import CircularProgress, { defaultDuration, easeOutQuart } from "./CircularProgress/CircularProgress";
import { useNetwork } from '../engine/hooks';
import { useTheme } from '../engine/hooks';

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
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    
    const ref = useRef<CircularProgress>(null);
    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];
    let Img = avatarImages[avatarHash(avatarId, avatarImages.length)];

    let size = Math.floor(42 * 0.6);
    let known = address ? KnownWallets(isTestnet)[address] : undefined;
    let lighter = Color(color).lighten(0.4).hex();
    let darker = Color(color).lighten(0.2).hex();

    if (known && known.colors) {
        lighter = known.colors.primary;
        darker = known.colors.secondary;
    }


    const [progressParams, setProgressParams] = useState({
        tintColor: darker,
        backgroundColor: lighter,
    });

    useEffect(() => {
        const timerId = setInterval(() => {
            if (progressParams.tintColor === darker) {
                setProgressParams({
                    tintColor: lighter,
                    backgroundColor: darker,
                });
            } else {
                setProgressParams({
                    tintColor: darker,
                    backgroundColor: lighter,
                });
            }
            ref.current?.animateTo(100, defaultDuration, easeOutQuart);
        }, defaultDuration, defaultDuration);

        return () => {
            clearInterval(timerId);
        }
    }, [progressParams]);

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
                {!known && (<Img
                    width={size}
                    height={size}
                    color="white"
                />)}
                {known && <KnownAvatar size={42} wallet={known} />}
            </View>
            <CircularProgress
                ref={ref}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    right: 0, bottom: 0,
                    transform: [{ rotate: '-90deg' }]
                }}
                progress={100}
                animateFromValue={0}
                duration={defaultDuration}
                size={42}
                width={3}
                color={progressParams.tintColor}
                backgroundColor={progressParams.backgroundColor}
                fullColor={null}
                loop={true}
                containerColor={theme.transparent}
            />
        </View>
    )
})