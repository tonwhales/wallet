import React, { ForwardedRef, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ViewStyle, StyleProp, Alert, TextInput, Pressable, TextStyle, Text } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { BarCodeScanner } from 'expo-barcode-scanner';
import { View } from "react-native";
import { Address } from "@ton/core";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { ATextInput, ATextInputRef } from "../ATextInput";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useClient4, useNetwork, useTheme } from "../../engine/hooks";
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../../utils/dns/dns";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { KnownWallets } from "../../secure/KnownWallets";

import Scanner from '@assets/ic-scanner-accent.svg';

const tonDnsRootAddress = Address.parse('Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq');

export const AddressDomainInput = memo(forwardRef(({
    style,
    inputStyle,
    onFocus,
    onBlur,
    onSubmit,
    target,
    input,
    onInputChange,
    onDomainChange,
    onTargetChange,
    isKnown,
    index,
    contact,
    labelStyle,
    labelText,
    showToMainAddress,
    onQRCodeRead,
    invalid,
    autoFocus
}: {
    style?: StyleProp<ViewStyle>,
    inputStyle?: StyleProp<TextStyle>,
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    target?: string,
    input: string,
    onInputChange: (value: string) => void,
    onTargetChange: (value: string) => void,
    onDomainChange: (domain: string | undefined) => void,
    isKnown?: boolean,
    index: number,
    contact?: AddressContact | null,
    labelStyle?: StyleProp<ViewStyle>,
    labelText?: string,
    showToMainAddress?: boolean,
    onQRCodeRead?: (value: string) => void,
    invalid?: boolean
    autoFocus?: boolean
}, ref: ForwardedRef<ATextInputRef>) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    
    const [focused, setFocused] = useState<boolean>(false);
    const [resolving, setResolving] = useState<boolean>();
    const [resolvedAddress, setResolvedAddress] = useState<Address>();

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

    const tref = useRef<TextInput>(null);
    useImperativeHandle(ref, () => ({
        focus: () => {
            tref.current!.focus();
        },
    }));

    const onResolveDomain = useCallback(
        async (toResolve: string, zone: '.t.me' | '.ton') => {
            // Clear prev resolved address
            setResolvedAddress(undefined);

            let domain = zone === '.ton'
                ? toResolve.slice(0, toResolve.length - 4)
                : toResolve.slice(0, toResolve.length - 5);

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
                const resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, toResolve, DNS_CATEGORY_WALLET);
                if (!resolvedDomainWallet) {
                    throw Error('Error resolving domain wallet');
                }
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());

                setResolvedAddress(resolvedWalletAddress);
                onTargetChange(resolvedWalletAddress.toString({ testOnly: network.isTestnet }));
                onDomainChange(toResolve);
            } catch (e) {
                Alert.alert(t('transfer.error.invalidDomain'));
                warn(e);
            }
            setResolving(false);
        }, []);

    useEffect(() => {
        onDomainChange(undefined);
        onTargetChange(input);

        if (input.endsWith('.ton')) {
            onResolveDomain(input, '.ton');
        } else if (input.endsWith('.t.me')) {
            onResolveDomain(input, '.t.me');
        }
    }, [input, onResolveDomain, onTargetChange]);

    const label = useMemo(() => {
        let text = t('common.domainOrAddressOrContact');

        if (!isKnown && contact && !resolvedAddress && !resolving) {
            text += ` • ${contact.name}`;
        }

        if (isKnown && target && !resolvedAddress && !resolving) {
            text += ` • ${KnownWallets(network.isTestnet)[target].name}`;
        }

        // TODO: add address resolving progress
        if (resolvedAddress && !resolving && !network.isTestnet) {
            text += ' • ';
            const t = resolvedAddress.toString({ testOnly: network.isTestnet });
            t.slice(0, 4) + '...' + t.slice(t.length - 4)
            text += t;
        }

        return text;
    }, [resolvedAddress, resolving, isKnown, contact, focused, target]);

    return (
        <View>
            <ATextInput
                autoFocus={autoFocus}
                value={input}
                index={index}
                ref={tref}
                onFocus={(index) => {
                    setFocused(true);
                    if (onFocus) {
                        onFocus(index);
                    }
                }}
                onValueChange={onInputChange}
                placeholder={t('common.domainOrAddressOrContact')}
                keyboardType={'default'}
                autoCapitalize={'none'}
                label={label}
                multiline
                autoCorrect={false}
                autoComplete={'off'}
                textContentType={'none'}
                style={style}
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
                enabled={!resolving}
                inputStyle={[inputStyle, { marginLeft: (focused && input.length === 0) ? 0 : -2 }]}
                textAlignVertical={'center'}
                actionButtonRight={
                    input.length === 0 && !!onQRCodeRead && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Pressable
                                onPress={openScanner}
                                style={{ height: 24, width: 24 }}
                            >
                                <Scanner height={24} width={24} style={{ height: 24, width: 24 }} />
                            </Pressable>
                        </Animated.View>
                    )
                }
            />
            {invalid && (input.length >= 48 || (!focused && input.length > 0)) && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <Text style={{
                        color: theme.accentRed,
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 16,
                        marginLeft: 16,
                        fontWeight: '400'
                    }}>
                        {t('transfer.error.invalidAddress')}
                    </Text>
                </Animated.View>
            )}
        </View>
    )
}));