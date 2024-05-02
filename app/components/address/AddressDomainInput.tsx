import React, { ForwardedRef, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { Alert, Pressable, Image, TextInput, View, Text, Platform, } from "react-native"
import Animated, { FadeIn, FadeOut, cancelAnimation, interpolate, setNativeProps, useAnimatedRef, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Address } from "@ton/core";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { ATextInputRef } from "../ATextInput";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { useClient4, useConfig } from "../../engine/hooks";
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../../utils/dns/dns";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { KnownWallet } from "../../secure/KnownWallets";
import { ReAnimatedCircularProgress } from "../CircularProgress/ReAnimatedCircularProgress";
import { AddressInputAction, InputActionType } from "./TransferAddressInput";
import { resolveBounceableTag } from "../../utils/resolveBounceableTag";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

export type AnimTextInputRef = {
    focus: () => void;
    blur?: () => void;
    setText: (text: string) => void;
}

export const AddressDomainInput = memo(forwardRef(({
    onFocus,
    onBlur,
    onSubmit,
    target,
    input,
    dispatch,
    isKnown,
    index,
    contact,
    onQRCodeRead,
    autoFocus,
    domain,
    screenWidth,
    bounceableFormat,
    knownWallets,
    theme,
    isTestnet,
    navigation
}: {
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    target?: string,
    input: string,
    dispatch: (action: AddressInputAction) => void,
    isKnown?: boolean,
    index: number,
    contact?: AddressContact | null,
    onQRCodeRead?: (value: string) => void,
    autoFocus?: boolean,
    domain?: string,
    screenWidth?: number,
    bounceableFormat: boolean,
    knownWallets: { [key: string]: KnownWallet },
    theme: ThemeType,
    isTestnet: boolean,
    navigation: TypedNavigation,
}, ref: ForwardedRef<AnimTextInputRef>) => {
    const client = useClient4(isTestnet);
    const netConfig = useConfig();
    const [resolving, setResolving] = useState<boolean>();

    const openScanner = useCallback(() => {
        if (!onQRCodeRead) {
            return;
        }

        (async () => {
            await BarCodeScanner.requestPermissionsAsync();
            navigation.popToTop();
            navigation.navigateScanner({ callback: onQRCodeRead });
        })();
    }, [onQRCodeRead]);

    const onResolveDomain = useCallback(async (
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

                dispatch({
                    type: InputActionType.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: isTestnet, bounceable })
                });
            } else {
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());
                const bounceable = await resolveBounceableTag(resolvedWalletAddress, { testOnly: isTestnet, bounceableFormat });

                dispatch({
                    type: InputActionType.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: isTestnet, bounceable })
                });
            }
        } catch (e) {
            Alert.alert(t('transfer.error.invalidDomain'));
            warn(e);
        }
        setResolving(false);
    }, [bounceableFormat, isTestnet, client]);

    const { suffix, textInput } = useMemo(() => {
        let suffix = undefined;
        let textInput = input;

        if (domain && target) {
            const t = target;

            return {
                suffix: t.slice(0, 4) + '...' + t.slice(t.length - 4),
                textInput: input
            }
        }

        if (!resolving && target) {
            if (isKnown) {
                suffix = target.slice(0, 4) + '...' + target.slice(target.length - 4);
                textInput = `${knownWallets[target].name}`
            } else if (contact) {
                suffix = target.slice(0, 4) + '...' + target.slice(target.length - 4);
                textInput = `${contact.name}`
            }
        }

        return { suffix, textInput };
    }, [resolving, isKnown, contact, target, input, domain]);

    const actionsRight = useMemo(() => {
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

        if (input.length === 0) {
            return (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <View style={{ flexDirection: 'row' }}>
                        {!!onQRCodeRead && (
                            <Pressable
                                onPress={openScanner}
                                style={{ height: 24, width: 24, marginLeft: undefined }}
                                hitSlop={36}
                            >
                                <Image source={require('@assets/ic-scan-tx.png')}
                                    style={{ height: 24, width: 24 }}
                                />
                            </Pressable>
                        )}
                    </View>
                </Animated.View>
            )
        }

        return (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Pressable
                    onPress={() => dispatch({ type: InputActionType.Clear })}
                    style={{ height: 24, width: 24 }}
                    hitSlop={36}
                >
                    <Image
                        source={require('@assets/ic-clear.png')}
                        style={{ height: 24, width: 24 }}
                    />
                </Pressable>
            </Animated.View>
        )
    }, [resolving, input, onQRCodeRead, openScanner]);

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

    const animatedRef = useAnimatedRef<TextInput>();

    useImperativeHandle(ref, () => ({
        focus: () => {
            animatedRef.current!.focus();
        },
        blur: () => {
            animatedRef.current!.blur();
        },
        setText: (text: string) => {
            animatedRef.current!.setNativeProps({ text });
        }
    }), []);

    const valueNotEmptyShared = useSharedValue(0);
    const labelHeightCoeff = useSharedValue(1);
    const valueNotEmpty = (textInput?.length || 0) > 0;
    const screenWidthValue = screenWidth ?? 0;
    const xTranslate = Math.round(screenWidthValue * 0.1) + Math.round(screenWidthValue / 2 * 0.01);

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
        valueNotEmptyShared.value = withTiming(valueNotEmpty ? 1 : 0, { duration: 100 });
    }, [valueNotEmpty]);

    return (
        <View style={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 26,
            flexShrink: 1
        }}>
            <View style={[
                { position: 'absolute', top: 0, right: 0, left: 0, paddingHorizontal: 16 },
                { marginLeft: -16 }
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
                        ]}
                    >
                        {t('common.domainOrAddressOrContact')}
                    </Text>
                </Animated.View>
            </View>
            <View style={{ width: '100%', flex: 1, flexShrink: 1 }}>
                <Animated.View style={labelShiftStyle} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AnimatedInput
                        ref={animatedRef}
                        style={{
                            color: theme.textPrimary,
                            marginHorizontal: 0, marginVertical: 0,
                            paddingBottom: 0, paddingTop: 0, paddingVertical: 0,
                            paddingLeft: 0, paddingRight: 0,
                            fontSize: 17, fontWeight: '400',
                            textAlignVertical: 'center',
                            flexShrink: 1,
                            flexGrow: suffix ? 0 : 1
                        }}
                        selectionColor={theme.accent}
                        cursorColor={theme.textPrimary}
                        autoFocus={autoFocus}
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        keyboardType={'default'}
                        returnKeyType={'next'}
                        autoComplete={'off'}
                        multiline
                        blurOnSubmit={false}
                        editable={!resolving}
                        onChangeText={(value) => {
                            // Remove leading and trailing spaces
                            value = value.trim();
                            if (value !== textInput) {
                                dispatch({
                                    type: InputActionType.Input,
                                    input: value
                                });
                            }
                        }}
                        textContentType={'none'}
                        onFocus={() => onFocus?.(index)}
                        onBlur={() => onBlur?.(index)}
                        onSubmitEditing={() => onSubmit?.(index)}
                    />
                    {suffix && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={[
                                {
                                    flexGrow: 1,
                                    alignSelf: 'center',
                                    flexShrink: 1,
                                    textAlignVertical: 'bottom',
                                    flex: 1,
                                    marginLeft: 5,
                                    color: theme.textSecondary,
                                    textAlign: 'left'
                                },
                                Typography.regular17_24
                            ]}
                        >
                            {suffix}
                        </Text>
                    )}
                </View>
                <Animated.View style={[inputHeightCompensatorStyle, { backgroundColor: 'rgba(255,125,0,0.2)' }]} />
            </View>
            {actionsRight}
        </View>
    );
}));

AddressDomainInput.displayName = 'AddressDomainInput';