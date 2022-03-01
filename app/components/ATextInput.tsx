import * as React from 'react';
import { KeyboardTypeOptions, Platform, ReturnKeyTypeOptions, StyleProp, View, ViewStyle, Text, TextStyle } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { ATextInputRef } from '../fragments/secure/TransferFragment';

export interface ATextInputProps {
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    placeholder?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    keyboardType?: KeyboardTypeOptions;
    returnKeyType?: ReturnKeyTypeOptions;
    autoCompleteType?:
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'email'
    | 'name'
    | 'password'
    | 'postal-code'
    | 'street-address'
    | 'tel'
    | 'username'
    | 'off';
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
    onSubmit?: (index: number) => void,
    index?: number
}

export const ATextInput = React.memo(React.forwardRef((props: ATextInputProps, ref: React.ForwardedRef<ATextInputRef>) => {
    const onFocus = React.useCallback(() => {
        if (props.onFocus && typeof props.index === 'number') {
            props.onFocus(props.index);
        }
    }, [props.index]);
    const onSubmit = React.useCallback(() => {
        console.log('[onSubmit]');
        if (props.onSubmit && props.index) {
            console.log('[onSubmit] submiting...');
            props.onSubmit(props.index);
        }
    }, [props.index]);

    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        }
    }));
    return (
        <Animated.View style={[{
            backgroundColor: '#F2F2F2',
            borderRadius: 12,
            paddingHorizontal: 16,
            flexDirection: 'row'
        }, props.style]}>
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
                        paddingTop: props.multiline ? 12 : 10,
                        paddingBottom: props.preventDefaultValuePadding
                            ? undefined
                            : props.multiline ? 14 : (Platform.OS === 'ios' ? 12 : 10),
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
                    autoCompleteType={props.autoCompleteType}
                    multiline={props.multiline}
                    enabled={props.enabled}
                    blurOnSubmit={props.blurOnSubmit}
                    editable={props.editable}
                    value={props.value}
                    textContentType={props.textContentType}
                    onChangeText={props.onValueChange}
                    onFocus={onFocus}
                    onSubmitEditing={onSubmit}
                />
                {props.actionButtonRight && (
                    props.actionButtonRight
                )}
            </View>
        </Animated.View>
    )
}));