import { memo } from 'react';
import { useSyncState, useTheme } from '../../../engine/hooks';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

import NoConnection from '@assets/ic-no-connection.svg';

const BlinkingDot = memo(({ size }: { size?: number }) => {
    const theme = useTheme();
    const opacity = useSharedValue(1);

    opacity.value = withRepeat(
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        Infinity
    )

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <View style={{ height: size ?? 12, width: size ?? 12, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={[{ width: size ?? 12, height: size ?? 12, borderRadius: size ?? 6, backgroundColor: theme.iconNav }, animatedStyle]} />
        </View>
    )
});

export const HeaderSyncStatus = memo(({ address, isLedger, size }: { address?: string, isLedger?: boolean, size?: number }) => {
    const theme = useTheme();
    const syncState = useSyncState(address);

    if (syncState === 'updating') {
        return <BlinkingDot size={size} />;
    }

    if (syncState === 'connecting') {
        return (
            <NoConnection
                height={size ?? 8}
                width={size ?? 8}
                style={{ height: size ?? 8, width: size ?? 8 }}
            />
        );
    }

    return (
        <View style={{ height: size ?? 12, width: size ?? 12, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.accentGreen, width: size ?? 12, height: size ?? 12, borderRadius: typeof size === 'number' ? size / 2 : 4 }} />
        </View>
    );
});