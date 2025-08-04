import React from 'react';
import { View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Typography } from '../styles';
import { AnimatedSkeleton } from '../skeletons/AnimatedSkeleton';
import { useTheme } from '../../engine/hooks/theme';

interface OrderInfoLineProps {
    icon: React.ComponentType<SvgProps>;
    label: string;
    value: string;
    isLoading?: boolean;
}

export const OrderInfoLine: React.FC<OrderInfoLineProps> = ({
    icon: Icon,
    label,
    value,
    isLoading = false
}) => {
    const theme = useTheme();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ 
                width: 20, 
                height: 20, 
                backgroundColor: theme.surfaceOnElevation, 
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center' 
            }}>
                <Icon color={theme.textSecondary} width={20} height={20} />
            </View>
            <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                {label}
            </Text>
            {isLoading ? <AnimatedSkeleton /> : (
                <Text style={[Typography.regular15_20, { color: theme.textPrimary, flex: 1, textAlign: 'right' }]}>
                    {value}
                </Text>
            )}
        </View>
    );
}; 