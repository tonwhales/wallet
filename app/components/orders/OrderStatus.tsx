import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../engine/hooks';

import ArrowIcon from '@assets/order/arrow.svg';
import SuccessIcon from '@assets/order/success.svg';
import FailureIcon from '@assets/order/failure.svg';
import { OrderCountdown } from './OrderCountdown';

interface OrderStatusProps {
    expiresAt: string;
    isInitial: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isFailure: boolean;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({
    expiresAt,
    isInitial,
    isPending,
    isSuccess,
    isFailure,
}) => {
    const theme = useTheme();
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (isInitial || isPending) {
            rotation.value = withRepeat(
                withTiming(360, {
                    duration: 2000,
                    easing: Easing.linear
                }),
                -1,
                false
            );
        }
    }, [isInitial, isPending, rotation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const getIconColor = () => {
        if (isSuccess) return theme.accentGreen;
        if (isPending) return theme.warning;
        if (isFailure) return theme.accentRed;
        return theme.accent;
    };

    const renderSpinner = (children?: React.ReactNode) => {
        const size = 92;
        const strokeWidth = 2;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        return (
            <View>
                <Animated.View style={animatedStyle}>
                    <Svg width={size} height={size}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={theme.divider}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeOpacity={0.5}
                        />
                        {(isInitial || isPending) && (
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={getIconColor()}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            />
                        )}


                    </Svg>
                </Animated.View>
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {children}
                </View>
            </View>
        );
    };

    const renderIcon = () => {
        if (isSuccess) {
            return <SuccessIcon width={56} height={56} color={getIconColor()} />;
        }

        if (isFailure) {
            return <FailureIcon width={56} height={56} color={getIconColor()} />;
        }

        if (isPending) {
            return <ArrowIcon width={56} height={56} style={{ transform: [{ rotate: '180deg' }] }} color={getIconColor()} />;
        }

        return null;
    };

    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        }}>
            <View style={{
                width: 92,
                height: 92,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}>
                {renderSpinner(renderIcon())}
                {isInitial && <OrderCountdown
                    expiresAt={expiresAt}
                    style={{
                        position: 'absolute'
                    }}
                />}
            </View>
        </View>
    );
};
