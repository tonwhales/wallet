import React, { useCallback, useEffect, useState } from "react"
import { View, Text, ViewStyle, StyleProp, Alert, TextInput } from "react-native"
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
import { DNS_CATEGORY_NEXT_RESOLVER, DNS_CATEGORY_WALLET, resolveDomain, tonDnsRootAddress, validateDomain } from "../utils/dns/dns"
import { useEngine } from "../engine/Engine"
import { AppConfig } from "../AppConfig"
import { AddressContact } from "../engine/products/SettingsProduct"

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
    contact
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
    contact?: AddressContact
}, ref: React.ForwardedRef<ATextInputRef>) => {
    const engine = useEngine();
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

            let domain;

            if (zone === '.ton') {
                domain = toResolve.slice(0, toResolve.length - 4);
                const valid = validateDomain(domain);

                if (!valid) {
                    Alert.alert(t('transfer.error.invalidDomainString'));
                    return;
                }
            }

            if (zone === '.t.me') {
                domain = toResolve.slice(0, toResolve.length - 5);
                const valid = validateDomain(domain);

                if (!valid) {
                    Alert.alert(t('transfer.error.invalidDomainString'));
                    return;
                }
            }

            if (!domain) {
                return;
            }

            setResolving(true);
            try {
                const resolvedCollectionAddress = await resolveDomain(engine.client4, tonDnsRootAddress, toResolve, DNS_CATEGORY_NEXT_RESOLVER, true);
                if (!resolvedCollectionAddress) {
                    throw Error('Error resolving collection address');
                }
                const collectionAddress = Address.parseRaw(resolvedCollectionAddress.toString());

                const resolvedDomainAddress = await resolveDomain(engine.client4, collectionAddress, domain, DNS_CATEGORY_NEXT_RESOLVER, true);
                if (!resolvedDomainAddress) {
                    throw Error('Error resolving domain address');
                }
                const domaindAddress = Address.parseRaw(resolvedDomainAddress.toString());

                const resolvedDomainWallet = await resolveDomain(engine.client4, domaindAddress, '.', DNS_CATEGORY_WALLET);
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
        },
        [],
    );

    useEffect(() => {
        onDomainChange(undefined);
        onTargetChange(input);

        // Check for domain 
        // min domain length is 4, max 126 + '.ton'
        if (input.length > 7 && input.length < 126 + 4 && input.slice(input.length - 4, input.length) === '.ton') {
            onResolveDomain(input, '.ton');
        }

        // min domain length is 4, max 126 + '.t.me'
        if (input.length > 8 && input.length < 126 + 5 && input.slice(input.length - 5, input.length) === '.t.me') {
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
            placeholder={AppConfig.isTestnet ? t('common.walletAddress') : t('common.domainOrAddress')}
            keyboardType={'ascii-capable'}
            autoCapitalize={'none'}
            preventDefaultHeight
            label={
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                }}>
                    <Text style={{
                        fontWeight: '500',
                        fontSize: 12,
                        color: '#7D858A',
                        alignSelf: 'flex-start',
                    }}>
                        {t('transfer.sendTo')}
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
                                color: '#858B93',
                                alignSelf: 'flex-start',
                            }}>
                                {KnownWallets[target].name}
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
                                color: '#858B93',
                                alignSelf: 'flex-start',
                            }}>
                                {contact.name}
                            </Text>
                        </Animated.View>
                    )}
                    {(resolvedAddress && !resolving && !AppConfig.isTestnet) && (
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
                                color: '#858B93',
                                alignSelf: 'flex-start',
                            }}>
                                <AddressComponent address={resolvedAddress} />
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
                                containerColor={'transparent'}
                            />
                        </Animated.View>
                    )}
                </View>
            }
            multiline
            autoCorrect={false}
            autoComplete={'off'}
            style={style}
            onBlur={onBlur}
            onSubmit={onSubmit}
            returnKeyType="next"
            blurOnSubmit={false}
            editable={!resolving}
            enabled={!resolving}
        />
    )
}));