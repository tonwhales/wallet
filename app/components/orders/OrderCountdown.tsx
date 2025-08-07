import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../engine/hooks';
import { Typography } from '../styles';
import { useCountdown } from '../../engine/hooks/common/useCountdown';

interface OrderCountdownProps {
    expiresAt: string;
    style?: any;
}

export const OrderCountdown: React.FC<OrderCountdownProps> = ({
    expiresAt,
    style
}) => {
    const theme = useTheme();
    const { timer } = useCountdown(expiresAt);

    return (
        <Text style={[
            Typography.semiBold17_24,
            {
                color: theme.textPrimary,
                textAlign: 'center',
            },
            style
        ]}>
            {timer.hours > 0 ? `${timer.hours < 10 ? `0${timer.hours}` : timer.hours}:` : ''}
            {`${timer.minutes < 10 ? `0${timer.minutes}` : timer.minutes}:`}
            {`${timer.seconds < 10 ? `0${timer.seconds}` : timer.seconds}`}
        </Text>
    );
};
