import React, { ForwardedRef, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef } from "react"
import { Pressable, Image, TextInput, View, Text, LayoutChangeEvent } from "react-native"
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";
import { ATextInputRef } from "../ATextInput";
import { isSolanaAddress, solanaAddressFromString } from "../../utils/solana/core";

export type SolanaAddressInputState = {
    input: string,
    target: string,
    suffix: string | undefined
}

export enum SolanaInputAction {
    Input = 'input',
    Target = 'target',
    InputTarget = 'input-target',
    Clear = 'clear'
}

export type SolanaAddressInputAction = {
    type: SolanaInputAction.Input,
    input: string,
} | {
    type: SolanaInputAction.Target,
    target: string,
} | {
    type: SolanaInputAction.InputTarget,
    input: string,
    target: string,
} | { type: SolanaInputAction.Clear }

export function solanaAddressInputReducer() {
    return (state: SolanaAddressInputState, action: SolanaAddressInputAction): SolanaAddressInputState => {
        switch (action.type) {
            case SolanaInputAction.Input:
                return {
                    ...state,
                    input: action.input,
                };
            case SolanaInputAction.Target:
                return {
                    ...state,
                    target: action.target,
                };
            case SolanaInputAction.InputTarget:
                return {
                    ...state,
                    input: action.input,
                    target: action.target,
                };
            case SolanaInputAction.Clear:
                return {
                    input: '',
                    target: '',
                    suffix: undefined,
                };
            default:
                return state;
        }
    }
}

function RightActions({ input, openScanner, rightAction, clear }: { input: string, openScanner: () => void, rightAction?: React.ReactNode, clear: () => void }) {

    return input.length > 0 ? (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                    onPress={clear}
                    style={{ height: 24, width: 24 }}
                    hitSlop={16}
                >
                    <Image
                        source={require('@assets/ic-clear.png')}
                        style={{ height: 24, width: 24 }}
                    />
                </Pressable>
            </View>
        </View>
    ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
                onPress={openScanner}
                style={{ height: 24, width: 24, marginLeft: undefined }}
                hitSlop={8}
            >
                <Image source={require('@assets/ic-scan-tx.png')}
                    style={{ height: 24, width: 24 }}
                />
            </Pressable>
            {rightAction}
        </View>
    )
}

export type SolanaAddressInputRef = Omit<ATextInputRef, 'setText'> & {
    inputAction: React.Dispatch<SolanaAddressInputAction>
}

export const SolanaAddressInput = memo(forwardRef(({
    onFocus,
    onBlur,
    onSubmit,
    onStateChange,
    initTarget,
    index,
    onQRCodeRead,
    autoFocus,
    theme,
    navigation,
}: {
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    onStateChange: (action: SolanaAddressInputState) => void,
    initTarget?: string,
    index: number,
    onQRCodeRead: (value: string) => void,
    autoFocus?: boolean,
    theme: ThemeType,
    navigation: TypedNavigation,
}, ref: ForwardedRef<SolanaAddressInputRef>) => {
    const [inputState, inputAction] = useReducer(
        solanaAddressInputReducer(),
        {
            input: initTarget || '',
            target: initTarget || '',
            suffix: undefined,
        }
    );

    useEffect(() => {
        onStateChange(inputState);
    }, [inputState]);

    const { input, target, suffix } = inputState;

    const openScanner = () => {
        (async () => {
            await BarCodeScanner.requestPermissionsAsync();
            navigation.navigateScanner({ callback: onQRCodeRead });
        })();
    };

    const { suff, textInput } = useMemo(() => {

        let suff = undefined;
        let textInput = input;

        if (target) {
            if (suffix) {
                suff = suffix;
            }
        }

        return { suff, textInput };
    }, [target, input, suffix]);

    const animatedRef = useRef<TextInput | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            animatedRef.current!.focus();
        },
        blur: () => {
            animatedRef.current!.blur();
        },
        inputAction
    }), [inputAction]);

    const valueNotEmptyShared = useSharedValue(0);

    const labelHeight = useSharedValue(0);
    const labelWidth = useSharedValue(0);

    const valueNotEmpty = (textInput?.length || 0) > 0;

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        labelHeight.value = height
        labelWidth.value = width
    };

    const labelAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(valueNotEmptyShared.value, [0, 1], [0, -labelWidth.value / 2]) },
                { translateY: interpolate(valueNotEmptyShared.value, [0, 1], [0, -labelHeight.value * 2]) },
                { scale: interpolate(valueNotEmptyShared.value, [0, 1], [1, 0.8]) },
                { translateX: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelWidth.value / 2]) },
                { translateY: interpolate(valueNotEmptyShared.value, [0, 1], [0, labelHeight.value * 2]) },
            ],
            opacity: interpolate(valueNotEmptyShared.value, [0, 0.2, 1], [1, 0.1, 1]),
        }
    });

    const labelShiftStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(valueNotEmptyShared.value, [0, 1], [0, 10]),
        }
    });

    const onChangeText = useCallback((value: string) => {
        // Remove leading and trailing spaces
        value = value.trim();
        if (value !== textInput) {
            const isAddress = isSolanaAddress(value);

            if (isAddress) {
                const target = solanaAddressFromString(value);
                inputAction({
                    type: SolanaInputAction.InputTarget,
                    input: value,
                    target
                });

                return;
            }

            inputAction({
                type: SolanaInputAction.Input,
                input: value
            });
        }
    }, [textInput, inputAction]);

    const focus = useCallback(() => onFocus?.(index), [index, onFocus]);
    const blur = useCallback(() => onBlur?.(index), [index, onBlur]);
    const submit = useCallback(() => onSubmit?.(index), [index, onSubmit]);
    const clear = useCallback(() => inputAction({ type: SolanaInputAction.Clear }), [inputAction]);

    useEffect(() => {
        valueNotEmptyShared.value = withTiming(valueNotEmpty ? 1 : 0, { duration: 50 });
    }, [valueNotEmpty]);

    return (
        <View
            style={{
                position: 'relative',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 26,
                flexShrink: 1
            }}
        >
            <View style={{
                position: 'absolute', top: 0, right: 0, left: 0,
                paddingHorizontal: 16, marginLeft: -16
            }}>
                <Animated.View onLayout={handleLayout} style={[labelAnimStyle, { maxWidth: '85%' }]}>
                    <Text
                        numberOfLines={1}
                        style={[
                            { color: theme.textSecondary },
                            Typography.regular17_24
                        ]}
                    >
                        {t('common.domainOrAddress')}
                    </Text>
                </Animated.View>
            </View>
            <View style={{ width: '100%', flex: 1, flexShrink: 1 }}>
                <Animated.View style={labelShiftStyle} />
                <View style={{ justifyContent: 'center', gap: 4, paddingRight: 56 }}>
                    <TextInput
                        ref={animatedRef}
                        value={input}
                        style={[{
                            color: theme.textPrimary,
                            marginHorizontal: 0, marginVertical: 0,
                            paddingBottom: 0, paddingTop: 0, paddingVertical: 0, paddingLeft: 0, paddingRight: 0,
                            textAlignVertical: 'center'
                        }, Typography.regular17_24]}
                        selectionColor={theme.accent}
                        cursorColor={theme.textPrimary}
                        autoFocus={autoFocus}
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        keyboardType={'default'}
                        returnKeyType={'next'}
                        autoComplete={'off'}
                        multiline
                        blurOnSubmit={false}
                        editable={true}
                        onChangeText={onChangeText}
                        textContentType={'none'}
                        onFocus={focus}
                        onBlur={blur}
                        onSubmitEditing={submit}
                    />
                    {suff && (
                        <View style={{ justifyContent: 'center' }}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    {
                                        flexShrink: 1,
                                        textAlignVertical: 'bottom',
                                        color: theme.textSecondary,
                                        textAlign: 'left'
                                    },
                                    Typography.regular17_24
                                ]}
                            >
                                {suff}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                justifyContent: 'center', alignItems: 'center'
            }}>
                <RightActions
                    input={input}
                    openScanner={openScanner}
                    clear={clear}
                />
            </View>
        </View>
    );
}));

SolanaAddressInput.displayName = 'SolanaAddressInput';