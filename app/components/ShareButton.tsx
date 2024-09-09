import React, { memo, useCallback } from "react";
import { Pressable, StyleProp, View, ViewStyle, Text, Platform, TextStyle } from "react-native";
import ShareIcon from '@assets/ic_share_address.svg';
import { t } from "../i18n/t";
import Share from 'react-native-share';
import { useTheme } from "../engine/hooks";
import { useToaster } from "./toast/ToastProvider";

const size = {
    height: 56,
    fontSize: 17,
    hitSlop: 0,
    pad: Platform.OS == 'ios' ? 0 : -1
}

export const ShareButton = memo(({
    body,
    style,
    disabled,
    showIcon,
    textStyle,
    onScreenCapture
}: {
    body: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean,
    showIcon?: boolean,
    textStyle?: StyleProp<TextStyle>,
    onScreenCapture?: () => Promise<{ uri: string }>
}) => {
    const theme = useTheme();
    const toaster = useToaster();
    const onShare = useCallback(async () => {
        let screenShot: { uri: string } | undefined;
        if (onScreenCapture) {
            screenShot = await onScreenCapture();
        }

        try {
            await Share.open({
                title: t('receive.share.title'),
                message: body,
                url: screenShot?.uri,
            });
        } catch {
            toaster.show({
                type: 'error',
                message: t('receive.share.error')
            });
        }
    }, [body]);

    return (
        <Pressable
            disabled={disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    flex: 1,
                    borderWidth: 1,
                    borderRadius: 16,
                    backgroundColor: theme.surfaceOnElevation,
                    overflow: 'hidden'
                },
                p.pressed && {
                    opacity: 0.55
                },
                style])}
            onPress={onShare}
        >
            <View style={{
                height: size.height - 2,
                flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center',
                minWidth: 64,
            }}>
                <View style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0, top: 0,
                    flexGrow: 1
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                    }}>
                        {showIcon && (
                            <View style={{ marginRight: 10 }}>
                                <ShareIcon width={15} height={24} />
                            </View>
                        )}
                        <Text
                            style={[
                                {
                                    color: theme.textPrimary,
                                    fontSize: size.fontSize,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                    flexShrink: 1
                                },
                                textStyle
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                        >
                            {t('common.share')}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});
