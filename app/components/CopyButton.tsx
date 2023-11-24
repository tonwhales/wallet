import React, { memo, useCallback } from "react";
import { Pressable, StyleProp, View, ViewStyle, Text, Platform, TextStyle } from "react-native";
import CopyIcon from '@assets/ic_copy_address.svg';
import CopyIconSuccess from '@assets/ic_copy_address_success.svg';
import { t } from "../i18n/t";
import { copyText } from "../utils/copyText";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { ToastDuration, useToaster } from "./toast/ToastProvider";
import { useTheme } from "../engine/hooks";

const size = {
    height: 56,
    fontSize: 17,
    hitSlop: 0,
    pad: Platform.OS == 'ios' ? 0 : -1
}

export const CopyButton = memo(({
    body,
    style,
    disabled,
    showIcon,
    textStyle
}: {
    body: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean,
    showIcon?: boolean,
    textStyle?: StyleProp<TextStyle>
}) => {
    const toaster = useToaster();
    const theme = useTheme();

    const doneShared = useSharedValue(0);

    const onCopy = useCallback(() => {
        copyText(body);

        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT
            }
        );

        doneShared.value = withTiming(
            1,
            { duration: 350, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
            (finished, _) => {
                if (finished) {
                    doneShared.value = withDelay(1500, withTiming(0, { duration: 350, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
                }
            }
        );
    }, [body, toaster]);

    const doneStyle = useAnimatedStyle(() => {
        return { opacity: doneShared.value };
    });

    const planeStyle = useAnimatedStyle(() => {
        return { opacity: interpolate(doneShared.value, [0, 1], [1, 0]) };
    });

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
            onPress={onCopy}
        >
            <View style={{
                height: size.height - 2,
                flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center',
                minWidth: 64,
            }}>
                <Animated.View style={[
                    {
                        position: 'absolute',
                        left: 0, right: 0, bottom: 0, top: 0,
                        flexGrow: 1
                    },
                    planeStyle
                ]}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                    }}>
                        {showIcon && (
                            <View style={{ marginRight: 10 }}>
                                <CopyIcon
                                    width={18}
                                    height={20}
                                />
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
                            {t('common.copy')}
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View style={[
                    {
                        position: 'absolute',
                        left: 0, right: 0, bottom: 0, top: 0,
                        flexGrow: 1,
                    },
                    doneStyle
                ]}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                    }}>
                        {showIcon && (
                            <View style={{ marginRight: 10 }}>
                                <CopyIconSuccess width={18} height={20} />
                            </View>
                        )}
                        <Text
                            style={[
                                {
                                    marginTop: size.pad,
                                    opacity: 1,
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
                            {t('common.copied')}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Pressable>
    );
});
