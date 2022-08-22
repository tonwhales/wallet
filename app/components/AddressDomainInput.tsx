import React, { useCallback, useEffect, useState } from "react"
import { View, Text, ViewStyle, StyleProp, Alert } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { t } from "../i18n/t"
import { ATextInput, ATextInputRef } from "./ATextInput"
import VerifiedIcon from '../../assets/ic_verified.svg';
import { KnownWallets } from "../secure/KnownWallets"
import { Address } from "ton"
import { warn } from "../utils/log"
import { AddressComponent } from "./AddressComponent"
import CircularProgress from "./CircularProgress/CircularProgress"
import { DNS_CATEGORY_NEXT_RESOLVER, DNS_CATEGORY_WALLET, resolveDomain, tonDnsRootAddress } from "../utils/dns/dns"
import { useEngine } from "../engine/Engine"
import { AppConfig } from "../AppConfig"

export const AddressDomainInput = React.memo(React.forwardRef(({
    style,
    onFocus,
    onBlur,
    onSubmit,
    target,
    onValueChange,
    isKnown,
    index
}: {
    style?: StyleProp<ViewStyle>;
    onFocus?: (index: number) => void,
    onBlur?: (index: number) => void,
    onSubmit?: (index: number) => void,
    target?: string;
    onValueChange?: (value: string) => void;
    isKnown?: boolean,
    index: number
}, ref: React.ForwardedRef<ATextInputRef>) => {
    const [value, setValue] = useState('');
    const engine = useEngine();
    const [domain, setDomain] = useState<string>();
    const [resolving, setResolving] = useState<boolean>();
    const [resolvedAddress, setResolvedAddress] = useState<Address>();

    const onResolveDomain = useCallback(
        async () => {
            if (!domain) {
                return;
            }

            setResolving(true);
            try {
                const resolvedDomainAddress = await resolveDomain(engine.client4, tonDnsRootAddress, domain, DNS_CATEGORY_NEXT_RESOLVER, true);
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
                if (onValueChange) onValueChange(resolvedWalletAddress.toFriendly({ testOnly: AppConfig.isTestnet }));
            } catch (e) {
                Alert.alert(t('transfer.error.invalidDomain'));
                warn(e);
            }
            setResolving(false);
        },
        [value, domain, onValueChange],
    );

    useEffect(() => {
        if (onValueChange) onValueChange(value);

        // Check for domain 
        // min domain length is 4, max 126 + '.ton'
        if (value.length > 7 && value.length < 126 + 4 && value.slice(value.length - 4, value.length) === '.ton') {
            setDomain(value.slice(0, value.length - 4));
            onResolveDomain();
        } else {
            setDomain(undefined);
        }
    }, [onResolveDomain, onValueChange]);


    return (
        <ATextInput
            value={value}
            index={index}
            ref={ref}
            onFocus={onFocus}
            onValueChange={setValue}
            placeholder={AppConfig.isTestnet ? t('common.walletAddress') : t('common.domainOrAddress')}
            keyboardType="ascii-capable"
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
                    {(isKnown && target && !domain) && (
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
                    {(domain && resolvedAddress && !resolving && !AppConfig.isTestnet) && (
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
                    {(domain && resolving && !AppConfig.isTestnet) && (
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