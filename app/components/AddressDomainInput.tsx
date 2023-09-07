import React, { useCallback, useEffect, useState } from "react"
import { View, Text, ViewStyle, StyleProp, Alert, TextInput, Pressable } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { t } from "../i18n/t"
import { ATextInput, ATextInputRef } from "./ATextInput"
import VerifiedIcon from '../../assets/ic_verified.svg';
import ContactIcon from '../../assets/ic_contacts.svg';
import { KnownWallets } from "../secure/KnownWallets"
import { Address } from "ton"
import { warn } from "../utils/log"
import { AddressComponent } from "./AddressComponent"
import CircularProgress from "./CircularProgress/CircularProgress"
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from "../utils/dns/dns"
import { useClient4 } from '../engine/hooks/useClient4'
import { useSelectedAccount } from '../engine/hooks/useSelectedAccount'
import { AddressContact } from '../engine/legacy/products/SettingsProduct'
import { useNetwork } from '../engine/hooks/useNetwork'
import { useTheme } from '../engine/hooks/useTheme'

const tonDnsRootAddress = Address.parse('Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq');

export const AddressDomainInput = React.memo(React.forwardRef(({
    style,
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
    labelText,
    showToMainAddress
}: {
    style?: StyleProp<ViewStyle>,
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
    labelText?: string,
    showToMainAddress?: boolean,
}, ref: React.ForwardedRef<ATextInputRef>) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const [resolving, setResolving] = useState<boolean>();
    const [resolvedAddress, setResolvedAddress] = useState<Address>();

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
                const resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, toResolve, DNS_CATEGORY_WALLET);
                if (!resolvedDomainWallet) {
                    throw Error('Error resolving domain wallet');
                }
                const resolvedWalletAddress = Address.parseRaw(resolvedDomainWallet.toString());

                setResolvedAddress(resolvedWalletAddress);
                onTargetChange(resolvedWalletAddress.toFriendly({ testOnly: isTestnet }));
                onDomainChange(toResolve);
            } catch (e) {
                Alert.alert(t('transfer.error.invalidDomain'));
                warn(e);
            }
            setResolving(false);
        },
        [],
    );

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
        <ATextInput
            value={input}
            index={index}
            ref={tref}
            onFocus={onFocus}
            onValueChange={onInputChange}
            placeholder={isTestnet ? t('common.walletAddress') : t('common.domainOrAddress')}
            keyboardType={'ascii-capable'}
            autoCapitalize={'none'}
            preventDefaultHeight
            label={
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: showToMainAddress ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    minHeight: showToMainAddress ? 24 : 0,
                }}>
                    <Text style={{
                        fontWeight: '500',
                        fontSize: 12,
                        color: theme.label,
                        alignSelf: 'flex-start',
                    }}>
                        {labelText ? labelText : t('transfer.sendTo')}
                    </Text>
                    {(isKnown && target && !resolvedAddress && !resolving) && (
                        <Animated.View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            entering={FadeIn.duration(150)}
                            exiting={FadeOut.duration(150)}
                        >
                            <VerifiedIcon
                                width={14}
                                height={14}
                                style={{ alignSelf: 'center', marginRight: 4 }}
                            />
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 12,
                                color: theme.labelSecondary,
                                alignSelf: 'flex-start',
                            }}>
                                {KnownWallets(isTestnet)[target].name}
                            </Text>
                        </Animated.View>
                    )}
                    {(!isKnown && contact && !resolvedAddress && !resolving) && (
                        <Animated.View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            entering={FadeIn.duration(150)}
                            exiting={FadeOut.duration(150)}
                        >
                            <ContactIcon
                                width={14}
                                height={14}
                                style={{ alignSelf: 'center', marginRight: 4 }}
                            />
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 12,
                                color: theme.labelSecondary,
                                alignSelf: 'flex-start',
                            }}>
                                {contact.name}
                            </Text>
                        </Animated.View>
                    )}
                    {(resolvedAddress && !resolving && !isTestnet) && (
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
                                color: theme.labelSecondary,
                                alignSelf: 'flex-start',
                            }}>
                                <AddressComponent address={resolvedAddress} />
                            </Text>
                        </Animated.View>
                    )}
                    {(resolving && !isTestnet) && (
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
                                containerColor={theme.transparent}
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
                                        backgroundColor: theme.accent,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingVertical: 4,
                                        paddingHorizontal: 8,
                                        borderRadius: 16
                                    }
                                }}
                                hitSlop={8}
                                onPress={() => {
                                    onInputChange(selected.address.toFriendly({ testOnly: isTestnet }))
                                }}
                            >
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 12,
                                    color: theme.item,
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
            onBlur={onBlur}
            onSubmit={onSubmit}
            returnKeyType={'next'}
            blurOnSubmit={false}
            editable={!resolving}
            enabled={!resolving}
        />
    )
}));