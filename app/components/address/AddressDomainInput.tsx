import React, { ForwardedRef, forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react"
import { ViewStyle, StyleProp, Alert, Pressable, TextStyle, Image } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { BarCodeScanner } from 'expo-barcode-scanner';
import { View } from "react-native";
import { Address } from "@ton/core";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { ATextInput, ATextInputRef } from "../ATextInput";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useClient4, useConfig, useNetwork, useTheme } from "../../engine/hooks";
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../../utils/dns/dns";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { KnownWallets } from "../../secure/KnownWallets";
import { ReAnimatedCircularProgress } from "../CircularProgress/ReAnimatedCircularProgress";
import { AddressInputAction, InputActionType } from "./TransferAddressInput";

export const AddressDomainInput = memo(forwardRef(({
    style,
    inputStyle,
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
    domain
}: {
    style?: StyleProp<ViewStyle>,
    inputStyle?: StyleProp<TextStyle>,
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
    domain?: string
}, ref: ForwardedRef<ATextInputRef>) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const netConfig = useConfig();

    const [focused, setFocused] = useState<boolean>(false);
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
                dispatch({
                    type: InputActionType.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: network.isTestnet })
                });
            } else {
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());
                dispatch({
                    type: InputActionType.DomainTarget,
                    domain: `${domain}${zone}`,
                    target: resolvedWalletAddress.toString({ testOnly: network.isTestnet })
                });
            }
        } catch (e) {
            Alert.alert(t('transfer.error.invalidDomain'));
            warn(e);
        }
        setResolving(false);
    }, []);

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
                textInput = `${KnownWallets(network.isTestnet)[target].name}`
            } else if (contact) {
                suffix = target.slice(0, 4) + '...' + target.slice(target.length - 4);
                textInput = `${contact.name}`
            }
        }

        return { suffix, textInput };
    }, [resolving, isKnown, contact, focused, target, input, domain]);

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

    const actionsWidth = input.length === 0
        ? 44 - (!!onQRCodeRead ? 0 : 40)
        : 24

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

    return (
        <View>
            <ATextInput
                autoFocus={autoFocus}
                value={textInput}
                index={index}
                ref={ref}
                maxLength={48}
                onFocus={(index) => {
                    setFocused(true);
                    if (onFocus) {
                        onFocus(index);
                    }
                }}
                onValueChange={(value) => {
                    if (value !== textInput) {
                        dispatch({
                            type: InputActionType.Input,
                            input: value
                        });
                    }
                }}
                placeholder={t('common.domainOrAddressOrContact')}
                keyboardType={'default'}
                autoCapitalize={'none'}
                label={t('common.domainOrAddressOrContact')}
                suffix={suffix}
                multiline
                autoCorrect={false}
                autoComplete={'off'}
                textContentType={'none'}
                style={[{ paddingHorizontal: 16, flexGrow: 1 }, style]}
                onBlur={(index) => {
                    setFocused(false);
                    if (onBlur) {
                        onBlur(index);
                    }
                }}
                onSubmit={onSubmit}
                returnKeyType={'next'}
                blurOnSubmit={false}
                editable={!resolving}
                inputStyle={[
                    {
                        width: suffix? undefined: '100%',
                        fontSize: 17, fontWeight: '400',
                        color: theme.textPrimary,
                        textAlignVertical: 'center',
                        marginLeft: (focused && input.length === 0) ? 0 : -8,
                        flexShrink: suffix ? 1 : undefined,
                    },
                    inputStyle
                ]}
                suffixStyle={{
                    flex: 1,
                    flexGrow: 1, marginLeft: 5,
                    fontSize: 17, fontWeight: '400',
                    color: theme.textSecondary,
                    textAlign: 'left'
                }}
                textAlignVertical={'center'}
                actionButtonRight={{
                    component: actionsRight,
                    width: actionsWidth
                }}
            />
        </View>
    )
}));