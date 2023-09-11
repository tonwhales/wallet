import React, { ForwardedRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { View, Text, ViewStyle, StyleProp, Alert, TextInput, Pressable, TextStyle } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { Address } from "ton"
import { AddressComponent } from "./AddressComponent"
import { BarCodeScanner } from 'expo-barcode-scanner';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../../utils/dns/dns"
import { t } from "../../i18n/t"
import { warn } from "../../utils/log"
import { ATextInput, ATextInputRef } from "../ATextInput"
import CircularProgress from "../CircularProgress/CircularProgress"
import { KnownWallets } from "../../secure/KnownWallets"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import { useAppConfig } from "../../utils/AppConfigContext"
import { useEngine } from "../../engine/Engine"
import { AddressContact } from "../../engine/products/SettingsProduct"

import Scanner from '../../../assets/ic-scanner-accent.svg';
import Clear from '../../../assets/ic-clear.svg';

const tonDnsRootAddress = Address.parse('Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq');

export const AddressDomainInput = React.memo(React.forwardRef(({
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
    contact?: AddressContact,
    labelStyle?: StyleProp<ViewStyle>,
    labelText?: string,
    showToMainAddress?: boolean,
    onQRCodeRead?: (value: string) => void,
    invalid?: boolean
    autoFocus?: boolean
}, ref: ForwardedRef<ATextInputRef>) => {
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const { Theme, AppConfig } = useAppConfig();
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
                const resolvedDomainWallet = await resolveDomain(engine.client4, tonDnsRootAddress, toResolve, DNS_CATEGORY_WALLET);
                if (!resolvedDomainWallet) {
                    throw Error('Error resolving domain wallet');
                }
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());

                setResolvedAddress(resolvedWalletAddress);
                onTargetChange(resolvedWalletAddress.toFriendly({ testOnly: AppConfig.isTestnet }));
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
            text += ` • ${KnownWallets(AppConfig.isTestnet)[target].name}`;
        }

        // TODO: add address resolving progress
        if (resolvedAddress && !resolving && !AppConfig.isTestnet) {
            text += ' • ';
            const t = resolvedAddress.toFriendly({ testOnly: AppConfig.isTestnet });
            t.slice(0, 4) + '...' + t.slice(t.length - 4)
            text += t;
        }

        return text;
    }, [resolvedAddress, resolving, isKnown, contact, focused, target]);

    return (
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
                input.length === 0
                    ? !!onQRCodeRead && (
                        <Pressable
                            onPress={openScanner}
                            style={{ height: 24, width: 24, marginLeft: 8 }}
                        >
                            <Scanner height={24} width={24} style={{ height: 24, width: 24 }} />
                        </Pressable>
                    )
                    : (focused && (
                        <Pressable
                            onPress={() => onInputChange('')}
                            style={{ height: 24, width: 24, marginLeft: 8 }}
                        >
                            <Clear height={24} width={24} style={{ height: 24, width: 24 }} />
                        </Pressable>
                    ))
            }
            error={
                invalid && (input.length >= 48 || (!focused && input.length > 0))
                    ? t('transfer.error.invalidAddress')
                    : undefined
            }
        />
    )
}));