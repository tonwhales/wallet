import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Typography } from '../styles';
import { Tag } from '../products/savings/CoinItem';
import CopyIcon from '@assets/ic-copy.svg';
import { ToastDuration, useToaster } from '../toast/ToastProvider';
import { copyText } from '../../utils/copyText';
import { useTheme } from '../../engine/hooks/theme';

interface OrderInfoRichProps {
    title: string;
    value: string;
    valueType?: 'light' | 'medium'
    tag?: string;
    withCopy?: boolean
    copyMessage?: string;
}

export const OrderInfoRich: React.FC<OrderInfoRichProps> = ({
    title,
    value,
    tag,
    withCopy,
    valueType = 'light',
    copyMessage
}) => {
    const theme = useTheme();
    const toaster = useToaster();
    const onCopy = useCallback(() => {
        copyText(value);
        if (copyMessage) {
            toaster.show(
                {
                    message: copyMessage,
                    type: 'default',
                    duration: ToastDuration.SHORT
                }
            );
        }
    }, [value, toaster, copyMessage]);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <View style={{ flexShrink: 1 }}>
                <Text style={[Typography.medium15_20, { color: theme.textSecondary }]}>
                    {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[valueType === 'medium' ? Typography.semiBold20_28 : Typography.regular17_24, { color: theme.textPrimary }]}>
                            {value}
                        </Text>
                        {tag && <Tag tag={tag.toUpperCase()} theme={theme} />}
                    </View>
                </View>
            </View>
            {withCopy && (
                <TouchableOpacity onPress={onCopy}>
                    <CopyIcon style={{ height: 16, width: 16 }} height={16} width={16} color={theme.iconPrimary} />
                </TouchableOpacity>
            )}
        </View>
    );
}; 