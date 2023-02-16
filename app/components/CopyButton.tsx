import React, { useCallback, useState } from "react";
import { Pressable, StyleProp, View, ViewStyle, Text, Platform } from "react-native";
import CopyIcon from '../../assets/ic_copy_address.svg';
import CopyIconSuccess from '../../assets/ic_copy_address_success.svg';
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { copyText } from "../utils/copyText";
import { iOSUIKit } from 'react-native-typography';
import Animated, { FadeOut, FlipInEasyX } from "react-native-reanimated";

const display = {
    backgroundColor: Theme.secondaryButton,
    borderColor: Theme.secondaryButton,
    textColor: Theme.textColor,

    backgroundPressedColor: Theme.selector,
    borderPressedColor: Theme.selector,
    textPressed: Theme.secondaryButtonText
}

const size = {
    height: 56,
    fontSize: 17,
    hitSlop: 0,
    pad: Platform.OS == 'ios' ? 0 : -1
}

export const CopyButton = React.memo(({
    text,
    style,
    disabled
}: {
    text: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean
}) => {
    const [done, setDone] = useState(false);

    const onCopy = useCallback(() => {
        copyText(text);
        setDone(true);
        setTimeout(() => {
            setDone(false);
        }, 1500);
    }, [text]);

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
            {(p) => (
                <View style={{
                    height: size.height - 2,
                    alignItems: 'center', justifyContent: 'center',
                    minWidth: 64,
                    paddingHorizontal: 16,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
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
                                    marginTop: size.pad,
                                    opacity: p.pressed ? 0.55 : 1,
                                    color: p.pressed ? display.textPressed : display.textColor,
                                    fontSize: size.fontSize,
                                    fontWeight: '600',
                                    includeFontPadding: false
                                }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                        >
                            {t('common.copy')}
                        </Text>

                        {Platform.OS === 'ios' && done && (
                            <View style={{
                                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            }}>
                                <Animated.View entering={FlipInEasyX} exiting={FadeOut}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
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
                                                    includeFontPadding: false
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
                        )}
                    </View>
                </View>
            )}
        </Pressable>
    );

});