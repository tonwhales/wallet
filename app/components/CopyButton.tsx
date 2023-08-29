import React, { useCallback } from "react";
import { Pressable, StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import CopyIcon from '../../assets/ic_copy_address.svg';
import CopyIconSuccess from '../../assets/ic_copy_address_success.svg';
import { t } from "../i18n/t";
import { copyText } from "../utils/copyText";
import { iOSUIKit } from 'react-native-typography';
import Animated, { EasingNode } from "react-native-reanimated";
import { useTheme } from '../engine/hooks/useTheme';

const size = {
    height: 56,
    fontSize: 17,
    hitSlop: 0,
    pad: Platform.OS == 'ios' ? 0 : -1
}

export const CopyButton = React.memo(({
    body,
    style,
    disabled
}: {
    body: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean
}) => {
    const theme = useTheme();
    const display = {
        backgroundColor: theme.secondaryButton,
        borderColor: theme.secondaryButton,
        textColor: theme.textColor,
    
        backgroundPressedColor: theme.selector,
        borderPressedColor: theme.selector,
        textPressed: theme.secondaryButtonText
    }
    const doneOpacity = React.useMemo(() => new Animated.Value<number>(0), []);

    const onCopy = useCallback(() => {
        copyText(body);
        Animated.timing(doneOpacity, {
            toValue: 1,
            duration: 350,
            easing: EasingNode.bezier(0.25, 0.1, 0.25, 1),
        }).start(() => {
            setTimeout(() => {
                Animated.timing(doneOpacity, {
                    toValue: 0,
                    duration: 350,
                    easing: EasingNode.bezier(0.25, 0.1, 0.25, 1),
                }).start();
            }, 1500);
        });
    }, [body]);

    return (
        <Pressable
            disabled={disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: display.backgroundColor,
                    borderColor: display.borderColor,
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
                <Animated.View style={[{
                    opacity: doneOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0]
                    }),
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0, top: 0,
                    flexGrow: 1
                }]}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        backgroundColor: display.backgroundColor,
                    }}>
                        <View style={{ marginRight: 10 }}>
                            <CopyIcon
                                width={18}
                                height={20}
                            />
                        </View>
                        <Text
                            style={[
                                iOSUIKit.title3,
                                {
                                    color: display.textColor,
                                    fontSize: size.fontSize,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                    flexShrink: 1
                                }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                        >
                            {t('common.copy')}
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View style={[{
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0, top: 0,
                    flexGrow: 1,
                    opacity: doneOpacity,
                }]}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        backgroundColor: display.backgroundColor,
                    }}>
                        <View style={{ marginRight: 10 }}>
                            <CopyIconSuccess width={18} height={20} />
                        </View>
                        <Text
                            style={[
                                iOSUIKit.title3,
                                {
                                    marginTop: size.pad,
                                    opacity: 1,
                                    color: display.textColor,
                                    fontSize: size.fontSize,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                    flexShrink: 1
                                }
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
