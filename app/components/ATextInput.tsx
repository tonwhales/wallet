import * as React from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleProp, View, ViewStyle, Text, TextStyle, Pressable, TouchableWithoutFeedback, Platform, InputModeOptions } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeInUp, FadeOutDown, LinearTransition, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTheme } from '../engine/hooks';
import { useDimensions } from '@react-native-community/hooks';
import { Typography } from './styles';

import Clear from '@assets/ic-clear.svg';

export type ATextInputRef = {
    focus: () => void;
    blur?: () => void;
    setText: (value: string) => void;
}

export interface ATextInputProps {
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    placeholder?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    keyboardType?: KeyboardTypeOptions;
    returnKeyType?: ReturnKeyTypeOptions;
    autoComplete?:
    | 'birthdate-day'
    | 'birthdate-full'
    | 'birthdate-month'
    | 'birthdate-year'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-day'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'email'
    | 'gender'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
    | 'password'
    | 'password-new'
    | 'postal-address'
    | 'postal-address-country'
    | 'postal-address-extended'
    | 'postal-address-extended-postal-code'
    | 'postal-address-locality'
    | 'postal-address-region'
    | 'postal-code'
    | 'street-address'
    | 'sms-otp'
    | 'tel'
    | 'tel-country-code'
    | 'tel-national'
    | 'tel-device'
    | 'username'
    | 'username-new'
    | 'off'
    | undefined;
    value?: string;
    onValueChange?: (value: string) => void;
    autoFocus?: boolean;
    multiline?: boolean;
    enabled?: boolean;
    editable?: boolean;
    textContentType?:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode';

    inputSuffix?: string;
    textAlign?: 'left' | 'center' | 'right' | undefined,
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined;
    fontSize?: number | undefined;
    lineHeight?: number | undefined;
    actionButtonRight?: { component: React.ReactNode, width: number },
    blurOnSubmit?: boolean,
    innerRef?: RefObject<View>,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    index?: number,
    label?: string,
    labelStyle?: StyleProp<ViewStyle>,
    labelTextStyle?: StyleProp<TextStyle>,
    backgroundColor?: string,
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined,
    suffix?: string,
    suffixStyle?: StyleProp<TextStyle>,
    error?: string,
    hideClearButton?: boolean,
    maxLength?: number,
    screenWidth?: number,
    inputMode?: InputModeOptions,
    cursorColor?: string,
    maxHeight?: number
}

export const ATextInput = memo(forwardRef((props: ATextInputProps, ref: ForwardedRef<ATextInputRef>) => {
    const theme = useTheme();
    const dimentions = useDimensions();
    const screenWidth = props.screenWidth ?? dimentions.screen.width;

    const [focused, setFocused] = useState(false);

    const hasValue = useMemo(() => (props.value && props.value.length > 0), [props.value]);

    const onFocus = useCallback(() => {
        setFocused(true);
        if (props.onFocus && typeof props.index === 'number') {
            props.onFocus(props.index);
        }
    }, [props.index, props.onFocus]);
    const onSubmit = useCallback(() => {
        if (props.onSubmit && typeof props.index === 'number') {
            props.onSubmit(props.index);
        }
    }, [props.index, props.onSubmit]);
    const onBlur = useCallback(() => {
        setFocused(false);
        if (props.onBlur && typeof props.index === 'number') {
            props.onBlur(props.index);
        }
    }, [props.index, props.onBlur]);

    const tref = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
        blur: () => {
            tref.current!.blur();
        },
        setText: (value: string) => {
            if (props.onValueChange) {
                props.onValueChange(value);
            }
        }
    }), [ref, tref]);

    const valueNotEmptyShared = useSharedValue(0);
    const labelHeightCoeff = useSharedValue(1);

    const withLabel = !!props.label;
    const valueNotEmpty = (props.value?.length || 0) > 0;

    const xTranslate = Math.round(screenWidth * 0.1) + 2;

    const labelAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: interpolate(valueNotEmptyShared.value, [0, 1], [1, 0.8]) },
                { translateX: interpolate(valueNotEmptyShared.value, [0, 1], [0, -xTranslate]) },
                { translateY: interpolate(valueNotEmptyShared.value, [0, 1], [2, -13]) },
            ],
            opacity: interpolate(valueNotEmptyShared.value, [0, 0.5, 1], [1, 0.1, 1]),
        }
    });

    const labelShiftStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeightCoeff.value * 10]),
        }
    });

    const inputHeightCompensatorStyle = useAnimatedStyle(() => {
        return {
            marginBottom: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeightCoeff.value * -4])
        }
    });

    useEffect(() => {
        cancelAnimation(valueNotEmptyShared);
        if (withLabel) {
            valueNotEmptyShared.value = withTiming(valueNotEmpty ? 1 : 0, { duration: 100 });
        }
    }, [withLabel, valueNotEmpty]);

    return (
        <>
            <TouchableWithoutFeedback
                style={{ position: 'relative' }}
                onPress={() => {
                    if (!focused) {
                        tref.current?.focus();
                        return;
                    }
                }}
            >
                <Animated.View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                    minHeight: 26
                }}>
                    {withLabel && (
                        <View style={[
                            { position: 'absolute', top: 0, right: 0, left: 0, paddingHorizontal: 16 },
                            props.labelStyle
                        ]}>
                            <Animated.View style={labelAnimStyle}>
                                <Text
                                    numberOfLines={1}
                                    onTextLayout={(e) => {
                                        if (e.nativeEvent.lines.length <= 1) {
                                            labelHeightCoeff.value = 1;
                                            return;
                                        }
                                        labelHeightCoeff.value = e.nativeEvent.lines.length * 1.4;
                                    }}
                                    style={[
                                        { color: theme.textSecondary },
                                        Typography.regular17_24,
                                        props.labelTextStyle
                                    ]}
                                >
                                    {props.label}
                                </Text>
                            </Animated.View>
                        </View>
                    )}
                    <View style={[{ flexDirection: 'row', alignItems: 'center' }, props.style]}>
                        <View style={{ width: '100%', flex: 1, flexShrink: 1 }}>
                            <Animated.View style={labelShiftStyle} />
                            <View
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                ref={props.innerRef}
                            >
                                <TextInput
                                    ref={tref}
                                    hitSlop={16}                         
                                    style={[
                                        {
                                            maxHeight: props.maxHeight,
                                            color: theme.textPrimary,
                                            fontSize: props.fontSize !== undefined ? props.fontSize : 17,
                                            lineHeight: props.lineHeight !== undefined ? props.lineHeight : undefined,
                                            fontWeight: props.fontWeight ? props.fontWeight : '400',
                                            textAlignVertical: props.textAlignVertical
                                                ? props.textAlignVertical
                                                : props.multiline
                                                    ? 'top'
                                                    : 'center',
                                            marginHorizontal: 0, marginVertical: 0,
                                            paddingBottom: 0, paddingTop: 0, paddingVertical: 0,
                                            paddingLeft: 0, paddingRight: 0,
                                            flexGrow: props.inputSuffix ? 0 : 1
                                        },
                                        props.inputStyle
                                    ]}
                                    selectionColor={Platform.select({
                                        ios: theme.accent,
                                        android: props.cursorColor ?? 'rgba(0, 0, 0, 0.3)',
                                    })}
                                    cursorColor={props.cursorColor ?? theme.textPrimary}
                                    textAlign={props.textAlign}
                                    autoFocus={props.autoFocus}
                                    placeholderTextColor={theme.textSecondary}
                                    autoCapitalize={props.autoCapitalize}
                                    placeholder={props.label ? undefined : props.placeholder}
                                    autoCorrect={props.autoCorrect}
                                    keyboardType={props.keyboardType}
                                    returnKeyType={props.returnKeyType}
                                    autoComplete={props.autoComplete}
                                    multiline={props.multiline}
                                    enabled={props.enabled}
                                    blurOnSubmit={props.blurOnSubmit}
                                    editable={props.editable}
                                    value={props.value}
                                    onChangeText={props.onValueChange}
                                    textContentType={props.textContentType}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    onSubmitEditing={onSubmit}
                                    maxLength={props.maxLength}
                                    inputMode={props.inputMode}
                                />
                                {props.inputSuffix && (
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 17,
                                            fontWeight: '400',
                                            alignSelf: 'center',
                                            marginLeft: 2,
                                            color: theme.textSecondary,
                                        }}
                                    >
                                        {props.inputSuffix}
                                    </Text>
                                )}
                                {props.suffix && (
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                        style={[
                                            {
                                                flexGrow: 1,
                                                alignSelf: 'center',
                                                color: theme.textSecondary,
                                                flexShrink: 1,
                                                textAlign: 'right',
                                                textAlignVertical: 'bottom'
                                            },
                                            Typography.regular15_20,
                                            props.suffixStyle
                                        ]}
                                    >
                                        {props.suffix}
                                    </Text>
                                )}
                            </View>
                            <Animated.View style={inputHeightCompensatorStyle} />
                        </View>
                        {!!props.actionButtonRight
                            ? (props.actionButtonRight.component)
                            : !props.hideClearButton && focused && hasValue && (
                                <Animated.View
                                    entering={FadeIn}
                                    layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
                                >
                                    <Pressable
                                        onPress={() => {
                                            if (props.onValueChange) {
                                                props.onValueChange('');
                                            }
                                        }}
                                        style={{ height: 24, width: 24 }}
                                        hitSlop={16}
                                    >
                                        <Clear height={24} width={24} style={{ height: 24, width: 24 }} />
                                    </Pressable>
                                </Animated.View>
                            )
                        }
                    </View>
                </Animated.View>
            </TouchableWithoutFeedback>
            {props.error && (
                <Animated.View style={{ marginTop: 2, marginLeft: 16 }} entering={FadeInUp} exiting={FadeOutDown}>
                    <Text style={{ color: theme.accentRed, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                        {props.error}
                    </Text>
                </Animated.View>
            )}
        </>
    );
}));