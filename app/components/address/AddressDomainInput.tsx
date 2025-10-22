import React, { ForwardedRef, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react"
import { Alert, Pressable, Image, TextInput, View, Text, LayoutChangeEvent } from "react-native"
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { Address } from "@ton/core";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { useClient4, useConfig, useTheme } from "../../engine/hooks";
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../../utils/dns/dns";
import { t } from "../../i18n/t";
import { KnownWallet } from "../../secure/KnownWallets";
import { ReAnimatedCircularProgress } from "../CircularProgress/ReAnimatedCircularProgress";
import { resolveBounceableTag } from "../../utils/resolveBounceableTag";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";
import { ATextInputRef } from "../ATextInput";
import { AddressSearchItem } from "./AddressSearch";
import { isSolanaAddress } from "../../utils/solana/address";
import { isTonAddress } from "../../utils/ton/address";
import { debounce } from "../../utils/debounce";

export type AddressInputState = {
    input: string,
    target: string,
    domain: string | undefined,
    suffix: string | undefined,
    addressType?: 'ton' | 'solana'
}

export enum InputAction {
    Input = 'input',
    Target = 'target',
    Domain = 'domain',
    DomainTarget = 'domain-target',
    InputTarget = 'input-target',
    Clear = 'clear',
}

export type AddressInputAction = {
    type: InputAction.Input,
    input: string,
} | {
    type: InputAction.Target,
    target: string,
} | {
    type: InputAction.Domain,
    domain: string | undefined,
} | {
    type: InputAction.DomainTarget,
    domain: string | undefined,
    target: string,
} | {
    type: InputAction.InputTarget,
    input: string,
    target: string,
    suffix: string,
    addressType: 'ton' | 'solana' | undefined,
} | { type: InputAction.Clear }

export function addressInputReducer() {
    return (state: AddressInputState, action: AddressInputAction): AddressInputState => {
        switch (action.type) {
            case InputAction.Input:
                if (action.input === state.input) {
                    return state;
                }

                let addressType: 'ton' | 'solana' | undefined;
                let target = '';

                try {
                    Address.parse(action.input);
                    target = action.input;
                    addressType = 'ton';
                } catch {
                    if (isSolanaAddress(action.input)) {
                        target = action.input;
                        addressType = 'solana';
                    }
                }
                return {
                    ...state,
                    input: action.input,
                    target,
                    suffix: undefined,
                    addressType
                };
            case InputAction.Target:
                return {
                    ...state,
                    target: action.target,
                    suffix: undefined
                };
            case InputAction.Domain:
                return {
                    ...state,
                    domain: action.domain,
                    suffix: undefined
                };
            case InputAction.DomainTarget:
                return {
                    ...state,
                    domain: action.domain,
                    target: action.target,
                    suffix: undefined
                };
            case InputAction.InputTarget:
                return {
                    ...state,
                    input: action.input,
                    target: action.target,
                    suffix: action.suffix,
                    addressType: action.addressType
                };
            case InputAction.Clear:
                return {
                    input: '',
                    target: '',
                    domain: undefined,
                    suffix: undefined
                };
            default:
                return state;
        }
    }
}

const RightActions = memo(({ resolving, input, openScanner, rightAction, clear }: { resolving: boolean | undefined, input: string, openScanner: () => void, rightAction?: React.ReactNode, clear: () => void }) => {
    const theme = useTheme();

    if (resolving) {
        return (
            <ReAnimatedCircularProgress
                size={24}
                color={theme.iconPrimary}
                reverse
                infinitRotate
                progress={0.8}
            />
        );
    }

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
});

export type AddressDomainInputRef = Omit<ATextInputRef, 'setText'> & {
    inputAction: React.Dispatch<AddressInputAction>
}

// TODO: pls refactor this component, its just sad
export const AddressDomainInput = memo(forwardRef(({
    acc,
    onFocus,
    onBlur,
    onSubmit,
    onSearchItemSelected,
    onStateChange,
    initTarget,
    isKnown,
    index,
    contact,
    onQRCodeRead,
    autoFocus,
    screenWidth,
    bounceableFormat,
    knownWallets,
    theme,
    isTestnet,
    navigation,
    solanaAddress,
    initDomain
}: {
    acc: Address,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    onStateChange: (action: AddressInputState) => void,
    onSearchItemSelected: (item: AddressSearchItem) => void,
    initTarget?: string,
    isKnown?: boolean,
    index: number,
    contact?: AddressContact | null,
    onQRCodeRead: (value: string) => void,
    autoFocus?: boolean,
    screenWidth?: number,
    bounceableFormat: boolean,
    knownWallets: { [key: string]: KnownWallet },
    theme: ThemeType,
    isTestnet: boolean,
    navigation: TypedNavigation,
    solanaAddress?: string,
    initDomain?: string,
}, ref: ForwardedRef<AddressDomainInputRef>) => {
    const client = useClient4(isTestnet);
    const netConfig = useConfig();
    const [resolving, setResolving] = useState<boolean>();

    const [inputState, inputAction] = useReducer(
        addressInputReducer(),
        {
            input: initTarget || '',
            target: initTarget || '',
            domain: initDomain || undefined,
            suffix: undefined,
            addressType: isSolanaAddress(initTarget || '') ? 'solana' : 'ton'
        }
    );

    const [displayText, setDisplayText] = useState(inputState.input);
    const [isFocused, setIsFocused] = useState(false);
    
    const { input, domain, target, suffix } = inputState;

    useEffect(() => {
        onStateChange(inputState);
        setDisplayText(input);
    }, [inputState]);


    const debouncedInputActionRef = useRef<ReturnType<typeof debounce<(value: string) => void>> | null>(null);

    if (!debouncedInputActionRef.current) {
        debouncedInputActionRef.current = debounce((value: string) => {
            inputAction({
                type: InputAction.Input,
                input: value
            });
        }, 300);
    }

    const openScanner = () => {
        (async () => {
            navigation.navigateScanner({ callback: onQRCodeRead });
        })();
    };

    const onResolveDomain = (async (
        toResolve: string, zone: '.t.me' | '.ton',
        rootDnsAddress: Address
    ) => {
        let domain = zone === '.ton'
            ? toResolve.slice(0, toResolve.length - 4)
            : toResolve.slice(0, toResolve.length - 5);

        domain = domain.toLowerCase();

        const valid = validateDomain(domain);

        if (!valid) {
            Alert.alert(t('transfer.error.invalidDomainString'));
            return;
        }

        if (!domain) {
            return;
        }

        setResolving(true);
        try {
            const resolvedDomainWallet = await resolveDomain(client, rootDnsAddress, toResolve, DNS_CATEGORY_WALLET);
            if (!resolvedDomainWallet) {
                throw Error('Error resolving domain wallet');
            }

            if (resolvedDomainWallet instanceof Address) {
                const resolvedWalletAddress = Address.parse(resolvedDomainWallet.toString());
                const bounceable = await resolveBounceableTag(resolvedWalletAddress, { testOnly: isTestnet, bounceableFormat });
                setDisplayText(`${domain}${zone}`)
                inputAction({
                    type: InputAction.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: isTestnet, bounceable })
                });
            } else {
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());
                const bounceable = await resolveBounceableTag(resolvedWalletAddress, { testOnly: isTestnet, bounceableFormat });
                setDisplayText(`${domain}${zone}`)
                inputAction({
                    type: InputAction.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: isTestnet, bounceable })
                });
            }
        } catch {
            Alert.alert(t('transfer.error.invalidDomain'));
        }
        setResolving(false);
    });

    const { suff, textInput } = useMemo(() => {

        let suff = undefined;
        let textInput = displayText;

        if (domain && target) {
            const t = target;

            return {
                suff: t.slice(0, 4) + '...' + t.slice(t.length - 4),
                textInput: displayText
            }
        }

        if (!resolving && target) {
            if (isKnown) {
                suff = target.slice(0, 4) + '...' + target.slice(target.length - 4);
                textInput = `${knownWallets[target].name}`;
            } else if (contact) {
                suff = target.slice(0, 4) + '...' + target.slice(target.length - 4);
                textInput = `${contact.name}`;
            } else if (suffix) {
                suff = suffix;
            }
        }

        return { suff, textInput };
    }, [resolving, isKnown, contact, target, displayText, domain, suffix]);

    useEffect(() => {
        if (!netConfig) {
            return;
        }
        if (textInput.endsWith('.ton')) {
            onResolveDomain(textInput, '.ton', Address.parse(netConfig.rootDnsAddress));
        } else if (textInput.endsWith('.t.me')) {
            onResolveDomain(textInput, '.t.me', Address.parse(netConfig.rootDnsAddress));
        }
    }, [textInput, netConfig]);

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
        }
    });

    const labelShiftStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(valueNotEmptyShared.value, [0, 1], [0, 14]),
        }
    });

    const onChangeText = useCallback((value: string) => {
        // We allow entering spaces for searching names of accounts
        // But we remove spaces for addresses
        const trimmed = value.trim();
        if (isTonAddress(trimmed) || isSolanaAddress(trimmed)) {
            value = trimmed;
        } else {
            value = value.trimStart();
        }
        if (value !== textInput) {
            setDisplayText(value);
            debouncedInputActionRef.current?.(value);
        }
    }, [textInput]);

    const focus = useCallback(() => {
        onFocus?.(index)
        setIsFocused(true);
    }, [index, onFocus]);

    const blur = useCallback(() => {
        onBlur?.(index)
        setIsFocused(false);
    }, [index, onBlur]);

    const submit = useCallback(() => onSubmit?.(index), [index, onSubmit]);

    const clear = useCallback(() => {
        debouncedInputActionRef.current?.cancel();
        setDisplayText('');
        animatedRef.current?.blur()
        setTimeout(() => {
            inputAction({ type: InputAction.Clear });
        }, 100);
    }, [inputAction]);

    useEffect(() => {
        valueNotEmptyShared.value = withTiming(valueNotEmpty || isFocused ? 1 : 0, { duration: 100 });
    }, [valueNotEmpty, isFocused]);

    const openAddressBook = () => {
        navigation.navigateAddressBook({
            account: acc.toString({ testOnly: isTestnet }),
            onSelected: onSearchItemSelected,
            solanaAddress: solanaAddress
        });
    };

    const rightAction = useMemo(() => {
        return (
            <Pressable
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1
                })}
                onPress={openAddressBook}
                hitSlop={4}
            >
                <Image
                    source={require('@assets/ic-address-book.png')}
                    style={{ height: 24, width: 24, tintColor: theme.accent }}
                />
            </Pressable>
        );
    }, []);

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
                        value={textInput}
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
                        editable={!resolving}
                        onChangeText={onChangeText}
                        textContentType={'none'}
                        onFocus={focus}
                        onBlur={blur}
                        onSubmitEditing={submit}
                    />
                    {suff && textInput && (
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
                    resolving={resolving}
                    input={textInput}
                    openScanner={openScanner}
                    rightAction={rightAction}
                    clear={clear}
                />
            </View>
        </View>
    );
}));

AddressDomainInput.displayName = 'AddressDomainInput';