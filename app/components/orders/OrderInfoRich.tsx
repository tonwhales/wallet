import React, { useCallback } from 'react';
import { View, Text, Pressable, Share, Platform } from 'react-native';
import { Typography } from '../styles';
import { Tag } from '../products/savings/CoinItem';
import CopyIcon from '@assets/ic-copy.svg';
import { ToastDuration, useToaster } from '../toast/ToastProvider';
import { copyText } from '../../utils/copyText';
import { useTheme } from '../../engine/hooks/theme';
import { Image } from 'expo-image';
import { t } from '../../i18n/t';
import { openWithInApp } from '../../utils/openWithInApp';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHANGELLY_TRANSACTION_URL } from '../../utils/constants/urls';
import { getAndroidActionSheetOptions } from '../../engine/utils/getAndroidActionSheetOptions';

interface OrderInfoRichProps {
    title: string;
    value: string;
    valueType?: 'light' | 'medium'
    tag?: string;
    withCopy?: boolean
    copyMessage?: string;
    isTransactionInfo?: boolean;
}

export const OrderInfoRich: React.FC<OrderInfoRichProps> = ({
    title,
    value,
    tag,
    withCopy,
    valueType = 'light',
    copyMessage,
    isTransactionInfo
}) => {
    const theme = useTheme();
    const toaster = useToaster();
    const { showActionSheetWithOptions } = useActionSheet();
    const inset = useSafeAreaInsets();

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

    const onPress = useCallback(() => {
        if (isTransactionInfo) {
            onTansactionPress();
        } else if (withCopy) {
            onCopy();
        }
    }, [isTransactionInfo, withCopy, onCopy, value]);

    const onTansactionPress = useCallback(() => {
        const options = [
            t('common.cancel'),
            t('common.viewIn', { name: 'Changelly' }),
            t('common.copy'),
            t('common.share')
        ];
        const cancelButtonIndex = 0;
        const changellyLink = `${CHANGELLY_TRANSACTION_URL}${value}`;

        showActionSheetWithOptions({
            title: t('common.tx'),
            message: value,
            options,
            cancelButtonIndex,
            ...(Platform.OS === 'android' && getAndroidActionSheetOptions(theme, inset)),
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp(changellyLink);
                    break;
                case 2:
                    copyText(value);
                    toaster.show(
                        {
                            message: t('common.copiedAlert'),
                            type: 'default',
                            duration: ToastDuration.SHORT,
                        }
                    );
                    break;
                case 3:
                    if (Platform.OS === 'ios') {
                        Share.share({ title: t('receive.share.title'), url: changellyLink });
                    } else {
                        Share.share({ title: t('receive.share.title'), message: changellyLink });
                    }
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [value, theme.style]);

    return (
        <Pressable
            disabled={!isTransactionInfo && !withCopy}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                opacity: pressed ? 0.5 : 1
            })}
            onPress={onPress}>
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
                <CopyIcon style={{ height: 16, width: 16 }} height={16} width={16} color={theme.iconPrimary} />
            )}
            {isTransactionInfo && (
                <Image
                    source={require('@assets/ic-explorer.png')}
                    style={{
                        tintColor: theme.iconPrimary,
                        height: 20, width: 20,
                        marginRight: -2,
                    }}
                />
            )}
        </Pressable>
    );
}; 