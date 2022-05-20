import * as React from 'react';
import { KeyboardTypeOptions, Platform, ReturnKeyTypeOptions, StyleProp, View, ViewStyle, Text, TextStyle } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export type ATextInputRef = {
    focus: () => void;
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
    preventDefaultHeight?: boolean,
    preventDefaultValuePadding?: boolean
    preventDefaultLineHeight?: boolean
    actionButtonRight?: any,
    blurOnSubmit?: boolean,
    innerRef?: React.RefObject<View>,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    index?: number,
    label?: any,
}

export const ATextInput = React.memo(React.forwardRef((props: ATextInputProps, ref: React.ForwardedRef<ATextInputRef>) => {
    const onFocus = React.useCallback(() => {
        if (props.onFocus && typeof props.index === 'number') {
            props.onFocus(props.index);
        }
    }, [props.index]);
    const onSubmit = React.useCallback(() => {
        if (props.onSubmit && props.index) {
            props.onSubmit(props.index);
        }
    }, [props.index]);
    const onBlur = React.useCallback(() => {
        if (props.onBlur && typeof props.index === 'number') {
            props.onBlur(props.index);
        }
    }, [props.index]);

    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
        blur: () => {
            tref.current!.blur();
        }
    }));

    let paddingTop = props.multiline ? 12 : 10;
    let paddingBottom = props.preventDefaultValuePadding
        ? undefined
        : props.multiline ? 14 : (Platform.OS === 'ios' ? 12 : 10);
    if (props.label) paddingTop = 6;

    return (
        <Animated.View style={[{
            backgroundColor: '#F2F2F2',
            borderRadius: 12,
            paddingHorizontal: 16,
            flexDirection: 'row'
        }, props.style]}>
            <View style={{ flex: 1, alignItems: 'center' }}>
                {!!props.label && (
                    <View style={{
                        width: '100%',
                        overflow: 'hidden',
                        position: 'relative',
                        marginTop: 10
                    }}>
                        {props.label}
                    </View>
                )}
                <View style={{ flex: 1, flexDirection: 'row' }} ref={props.innerRef} >
                    {props.prefix && (
                        <Text
                            numberOfLines={1}
                            style={{
                                marginTop: 3,
                                fontSize: 17,
                                fontWeight: '400',
                                alignSelf: 'center',
                                color: '#9D9FA3',
                            }}
                        >
                            {props.prefix}
                        </Text>
                    )}
                    <TextInput
                        ref={tref}
                        style={[{
                            height: props.preventDefaultHeight
                                ? undefined
                                : props.multiline ? 44 * 3 : 48,
                            paddingTop: paddingTop,
                            paddingBottom: paddingBottom,
                            flexGrow: 1,
                            fontSize: props.fontSize ? props.fontSize : 17,
                            lineHeight: props.lineHeight
                                ? props.lineHeight
                                : props.preventDefaultLineHeight ? undefined : 22,
                            fontWeight: props.fontWeight ? props.fontWeight : '400',
                            textAlignVertical: props.multiline ? 'top' : 'center'
                        }, props.inputStyle]}
                        textAlign={props.textAlign}
                        autoFocus={props.autoFocus}
                        placeholder={props.placeholder}
                        placeholderTextColor="#9D9FA3"
                        autoCapitalize={props.autoCapitalize}
                        autoCorrect={props.autoCorrect}
                        keyboardType={props.keyboardType}
                        returnKeyType={props.returnKeyType}
                        autoComplete={props.autoComplete}
                        multiline={props.multiline}
                        enabled={props.enabled}
                        blurOnSubmit={props.blurOnSubmit}
                        editable={props.editable}
                        value={props.value}
                        textContentType={props.textContentType}
                        onChangeText={props.onValueChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onSubmitEditing={onSubmit}
                    />
                    {props.actionButtonRight && (
                        props.actionButtonRight
                    )}
                </View>
            </View>
        </Animated.View>
    )
}));