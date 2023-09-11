import * as React from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleProp, View, ViewStyle, Text, TextStyle, Pressable, useWindowDimensions } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAppConfig } from '../utils/AppConfigContext';
import Animated, { Layout, cancelAnimation, interpolate, measure, useAnimatedRef, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

export type ATextInputRef = {
    focus: () => void;
    blur?: () => void;
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

    prefix?: string;
    textAlign?: 'left' | 'center' | 'right' | undefined,
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined;
    fontSize?: number | undefined;
    lineHeight?: number | undefined;
    actionButtonRight?: any,
    blurOnSubmit?: boolean,
    innerRef?: RefObject<View>,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    index?: number,
    label?: string,
    backgroundColor?: string,
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined,
    suffux?: string,
    error?: string
}

export const ATextInput = memo(forwardRef((props: ATextInputProps, ref: ForwardedRef<ATextInputRef>) => {
    const dimentions = useWindowDimensions();
    const { Theme } = useAppConfig();
    const [focused, setFocused] = useState(false);

    const onFocus = useCallback(() => {
        setFocused(true);
        if (props.onFocus && typeof props.index === 'number') {
            props.onFocus(props.index);
        }
    }, [props.index]);
    const onSubmit = useCallback(() => {
        if (props.onSubmit && props.index) {
            props.onSubmit(props.index);
        }
    }, [props.index]);
    const onBlur = useCallback(() => {
        setFocused(false);
        if (props.onBlur && typeof props.index === 'number') {
            props.onBlur(props.index);
        }
    }, [props.index]);

    const tref = useRef<TextInput>(null);
    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
        blur: () => {
            tref.current!.blur();
        }
    }));

    const valueNotEmptyShared = useSharedValue(0);
    const withLabel = !!props.label;
    const valueNotEmpty = (props.value?.length || 0) > 0;

    const availableWidth = dimentions.width;
    const maxChars = Math.floor(availableWidth / 10);
    const labelHeight = useSharedValue(maxChars < (props.label?.length || 0) ? 36 : 18);

    useLayoutEffect(() => {
        labelHeight.value = maxChars < (props.label?.length || 0) ? 36 : 18;
    }, [props.label, focused]);

    const labelAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: interpolate(valueNotEmptyShared.value, [0, 1], [1, 0.8]) },
                { translateX: interpolate(valueNotEmptyShared.value, [0, 1], [0, -40]) },
                { translateY: interpolate(valueNotEmptyShared.value, [0, 1], [2, -13]) },
            ]
        }
    });

    const labelShiftStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeight.value === 18 ? 8 : 28]),
        }
    });

    const inputHeightCompensatorStyle = useAnimatedStyle(() => {
        return {
            marginBottom: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeight.value === 18 ? -8 : -6])
        }
    });

    useEffect(() => {
        cancelAnimation(valueNotEmptyShared);
        valueNotEmptyShared.value = withTiming(withLabel && valueNotEmpty ? 1 : 0, { duration: 100 });
    }, [withLabel, valueNotEmpty, focused]);

    console.log(labelHeight.value);

    return (
        <Pressable
            style={{ position: 'relative' }}
            onPress={() => {
                tref.current?.focus();
            }}
        >
            <Animated.View style={[
                {
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                },
                props.style
            ]}>
                <View style={{ width: '100%', flex: 1 }}>
                    {withLabel && (
                        <View style={{ position: 'absolute', top: 0, right: 0, left: 0 }}>
                            <Animated.View
                                style={[labelAnimStyle]}
                            >
                                <Text
                                    style={{
                                        color: Theme.textSecondary,
                                        fontSize: 17,
                                        fontWeight: '400'
                                    }}>
                                    {props.label}
                                </Text>
                            </Animated.View>
                        </View>
                    )}
                    <Animated.View style={labelShiftStyle} />
                    <View
                        style={[{
                            flex: 1, flexGrow: 1,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }]}
                        ref={props.innerRef}
                    >
                        <TextInput
                            ref={tref}
                            style={[
                                {
                                    color: Theme.textPrimary,
                                    fontSize: props.fontSize !== undefined ? props.fontSize : 17,
                                    lineHeight: props.lineHeight !== undefined ? props.lineHeight : undefined,
                                    fontWeight: props.fontWeight ? props.fontWeight : '400',
                                    textAlignVertical: props.textAlignVertical
                                        ? props.textAlignVertical
                                        : props.multiline
                                            ? 'top'
                                            : 'center',
                                },
                                props.inputStyle
                            ]}
                            selectionColor={Theme.textPrimary}
                            cursorColor={Theme.textPrimary}
                            textAlign={props.textAlign}
                            autoFocus={props.autoFocus}
                            placeholderTextColor={Theme.textSecondary}
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
                        />
                        {props.prefix && (
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontSize: 17,
                                    fontWeight: '400',
                                    alignSelf: 'center',
                                    marginLeft: 2,
                                    color: Theme.textSecondary,
                                }}
                            >
                                {props.prefix}
                            </Text>
                        )}
                        {props.suffux && (
                            <Text
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                                style={{
                                    flexGrow: 1,
                                    fontSize: 15, lineHeight: 20,
                                    fontWeight: '400',
                                    alignSelf: 'center',
                                    color: Theme.textSecondary,
                                    flexShrink: 1,
                                    textAlign: 'right'
                                }}
                            >
                                {props.suffux}
                            </Text>
                        )}
                    </View>
                    <Animated.View style={inputHeightCompensatorStyle} />
                </View>
                {props.actionButtonRight && (
                    props.actionButtonRight
                )}
            </Animated.View>
            {props.error && (
                <Animated.View style={{ marginTop: 2, marginLeft: 16 }} layout={Layout.duration(300)}>
                    <Text style={{ color: Theme.accentRed, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                        {props.error}
                    </Text>
                </Animated.View>
            )}
        </Pressable>
    )
}));