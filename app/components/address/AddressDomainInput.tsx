import React, { useCallback, useEffect, useState } from "react"
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
}, ref: React.ForwardedRef<ATextInputRef>) => {
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

    const tref = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => ({
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

    return (
        <>
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
                preventDefaultHeight
                preventDefaultLineHeight
                label={
                    <View style={[{
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: showToMainAddress ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        minHeight: showToMainAddress ? 24 : undefined,
                    }, labelStyle]}>
                        {input.length > 0 && (
                            <Animated.View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                entering={FadeIn.duration(150)}
                                exiting={FadeOut.duration(150)}
                            >
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 12,
                                    color: Theme.labelSecondary,
                                    alignSelf: 'flex-start',
                                }}>
                                    {AppConfig.isTestnet ? t('common.walletAddress') : t('common.domainOrAddress')}
                                    {(!isKnown && contact && !resolvedAddress && !resolving)
                                        && !focused
                                        && (
                                            <Text>
                                                {` • ${contact.name}`}
                                            </Text>
                                        )}
                                    {(isKnown && target && !resolvedAddress && !resolving)
                                        && !focused
                                        && (
                                            <Text>
                                                {` • ${KnownWallets(AppConfig.isTestnet)[target].name}`}
                                            </Text>
                                        )}
                                    {(resolvedAddress && !resolving && !AppConfig.isTestnet) && (
                                        <Text>
                                            {' • '}
                                            <AddressComponent start={4} address={resolvedAddress} />
                                        </Text>
                                    )}
                                </Text>
                            </Animated.View>
                        )}
                        {(resolving && !AppConfig.isTestnet) && (
                            <Animated.View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                entering={FadeIn.duration(150)}
                                exiting={FadeOut.duration(150)}
                            >
                                <CircularProgress
                                    style={{
                                        transform: [{ rotate: '-90deg' }],
                                        marginRight: 4
                                    }}
                                    progress={100}
                                    animateFromValue={0}
                                    duration={6000}
                                    size={12}
                                    width={2}
                                    color={'#FFFFFF'}
                                    backgroundColor={'#596080'}
                                    fullColor={null}
                                    loop={true}
                                    containerColor={Theme.transparent}
                                />
                            </Animated.View>
                        )}
                        {input.length === 0 && showToMainAddress && (
                            <Animated.View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                entering={FadeIn}
                                exiting={FadeOut}
                            >
                                <Pressable
                                    style={({ pressed }) => {
                                        return {
                                            opacity: pressed ? 0.5 : 1,
                                            backgroundColor: Theme.accent,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingVertical: 4,
                                            paddingHorizontal: 8,
                                            borderRadius: 16
                                        }
                                    }}
                                    hitSlop={8}
                                    onPress={() => {
                                        onInputChange(engine.address.toFriendly({ testOnly: AppConfig.isTestnet }))
                                    }}
                                >
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 12,
                                        color: Theme.item,
                                        alignSelf: 'flex-start',
                                    }}>
                                        {t('hardwareWallet.actions.mainAddress')}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        )}
                    </View>
                }
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
                inputStyle={inputStyle}
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
        </>
    )
}));