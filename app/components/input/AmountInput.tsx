import { ForwardedRef, forwardRef, memo, useImperativeHandle, useRef, useState } from "react";
import { ATextInputProps, ATextInputRef } from "../ATextInput";
import { TextInput, TouchableWithoutFeedback } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Platform, View, Text } from "react-native";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";

type AmountInputProps = ATextInputProps & {
    ticker?: string,
    onFocus?: () => void,
    onBlur?: () => void,
    onSubmit?: () => void,
}

export const AmountInput = memo(forwardRef((props: AmountInputProps, ref: ForwardedRef<ATextInputRef>) => {
    const theme = useTheme();
    const {
        innerRef,
        ticker, textAlign, cursorColor, autoFocus, placeholder, autoCorrect, label,
        returnKeyType, enabled, editable, maxLength, blurOnSubmit,
        suffix, suffixStyle,
        onValueChange, value,
        onFocus, onBlur, onSubmit,
        style, inputStyle, fontSize, lineHeight, fontWeight, textAlignVertical,
    } = props;

    const tref = useRef<TextInput>(null);
    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
        blur: () => {
            tref.current!.blur();
        },
        setText: (value: string) => {
            if (onValueChange) {
                onValueChange(value);
            }
        }
    }), [ref, tref]);

    const onFocusHandler = () => {
        if (onFocus) {
            onFocus();
        }
    }

    const onBlurHandler = () => {
        if (onBlur) {
            onBlur();
        }
    }

    return (
        <TouchableWithoutFeedback
            style={{ position: 'relative' }}
            onPress={() => {
                tref.current!.focus();
            }}
        >
            <Animated.View style={{
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
                minHeight: 26
            }}>
                <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
                    <View style={{ width: '100%', flex: 1, flexShrink: 1 }}>
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                            ref={innerRef}
                        >
                            <TextInput
                                ref={tref}
                                style={[
                                    {
                                        color: theme.textPrimary,
                                        fontSize: fontSize ?? 17,
                                        lineHeight,
                                        fontWeight: fontWeight || '400',
                                        textAlignVertical: textAlignVertical || 'center',
                                        marginHorizontal: 0, marginVertical: 0,
                                        paddingBottom: 0, paddingTop: 0, paddingVertical: 0,
                                        paddingLeft: 0, paddingRight: 0,
                                        flexGrow: ticker ? 0 : 1
                                    },
                                    inputStyle,
                                ]}
                                selectionColor={Platform.select({
                                    ios: theme.accent,
                                    android: cursorColor ?? 'rgba(0, 0, 0, 0.3)',
                                })}
                                cursorColor={cursorColor ?? theme.textPrimary}
                                textAlign={textAlign}
                                autoFocus={autoFocus}
                                keyboardType={'numeric'}
                                placeholderTextColor={theme.textSecondary}
                                placeholder={label ? undefined : placeholder}
                                autoCorrect={autoCorrect}
                                returnKeyType={returnKeyType}
                                enabled={enabled}
                                blurOnSubmit={blurOnSubmit}
                                editable={editable}
                                value={value}
                                onChangeText={onValueChange}
                                onFocus={onFocusHandler}
                                onBlur={onBlurHandler}
                                onSubmitEditing={onSubmit}
                                maxLength={maxLength}
                            />
                            {ticker && (
                                <View style={{ flexDirection: 'row', position: 'absolute', left: 0, gap: 2 }}>
                                    <Text style={{
                                        flexShrink: 1,
                                        fontSize: fontSize ?? 17,
                                        lineHeight,
                                        fontWeight: fontWeight || '400',
                                        opacity: 0
                                    }}>
                                        {value}
                                    </Text>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: fontSize ?? 17,
                                            fontWeight: '400',
                                            lineHeight,
                                            alignSelf: 'center',
                                            color: theme.textSecondary,
                                        }}
                                    >
                                        {ticker}
                                    </Text>
                                </View>
                            )}
                            {suffix && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                    style={[
                                        {
                                            alignSelf: 'center',
                                            color: theme.textSecondary,
                                            flexShrink: 1,
                                            textAlign: 'right',
                                            textAlignVertical: 'bottom'
                                        },
                                        Typography.regular15_20,
                                        suffixStyle
                                    ]}
                                >
                                    {suffix}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback >
    );
}));