import React, { memo, useEffect } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { avatarHash } from "../../utils/avatarHash";
import { Avatar, avatarColors } from "./Avatar";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { KnownWallet } from "../../secure/KnownWallets";
import { useWalletSettings } from "../../engine/hooks";
import { ThemeType } from "../../engine/state/theme";
import { Image } from "expo-image";
import { ForcedAvatar, ForcedAvatarType } from "./ForcedAvatar";

const Color = require('color');

export const PendingTransactionAvatar = memo(({
    style,
    avatarId,
    address,
    kind,
    knownWallets,
    theme,
    forceAvatar
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string,
    address?: string,
    kind: 'in' | 'out',
    knownWallets: { [key: string]: KnownWallet },
    theme: ThemeType,
    forceAvatar?: ForcedAvatarType
}) => {
    const [walletSettings] = useWalletSettings(address);
    const avatarColorHash = walletSettings?.color ?? avatarHash(avatarId, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const rotation = useSharedValue(0);

    const animatedRotation = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 360}deg` }] }), []);

    let known = address ? knownWallets[address] : undefined;
    let lighter = Color(avatarColor).lighten(0.4).hex();
    let darker = Color(avatarColor).lighten(0.2).hex();

    if (known && known.colors) {
        lighter = known.colors.primary;
        darker = known.colors.secondary;
    }

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(rotation.value + 1, { duration: 1500, easing: Easing.linear }),
            -1,
        );
    }, []);

    return (
        <View style={[{ flex: 1, height: 46, width: 46, justifyContent: 'center', alignItems: 'center' }, style]}>
            <View style={{
                position: 'absolute',
                top: 0, left: 0,
                right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!!forceAvatar ? (
                    <ForcedAvatar type={forceAvatar} size={46} hideVerifIcon />
                ) : (
                    <Avatar
                        address={address}
                        size={46}
                        id={avatarId}
                        hash={walletSettings.avatar}
                        borderWith={0}
                        backgroundColor={avatarColor}
                        theme={theme}
                        knownWallets={knownWallets}
                    />
                )}
            </View>
            <Animated.View style={[
                {
                    height: 20,
                    width: 20,
                    position: 'absolute',
                    bottom: -2, right: -2,
                },
                animatedRotation
            ]}>
                <View
                    style={{
                        backgroundColor: '#FF9A50',
                        height: 20, width: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: (style as ViewStyle)?.backgroundColor ?? theme.surfaceOnElevation,
                        justifyContent: 'center', alignItems: 'center'
                    }}
                >
                    <Image style={{ height: 10, width: 10 }} source={require('@assets/ic-pending-arch.png')} />
                </View>
            </Animated.View>
        </View>
    )
})