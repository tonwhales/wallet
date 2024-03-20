import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect } from "react";
import { Platform, Pressable, View, Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { Avatar, avatarColors } from "../Avatar";
import { AddressDomainInput } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallets } from "../../secure/KnownWallets";
import { useAppState, useContact, useTheme, useWalletSettings } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AddressSearch, AddressSearchItem } from "./AddressSearch";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { avatarHash } from "../../utils/avatarHash";

import IcChevron from '@assets/ic_chevron_forward.svg';
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";

type TransferAddressInputProps = {
    acc: Address,
    theme: ThemeType,
    validAddress?: Address,
    isTestnet: boolean,
    index: number,
    target: string,
    input: string,
    domain?: string,
    dispatch: (action: AddressInputAction) => void,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
    onSearchItemSelected?: (item: AddressSearchItem) => void,
}

export type AddressInputState = {
    input: string,
    target: string,
    domain: string | undefined,
}

export enum InputActionType {
    Input = 'input',
    Target = 'target',
    Domain = 'domain',
    DomainTarget = 'domain-target',
    InputTarget = 'input-target',
    Clear = 'clear',
}

export type AddressInputAction = {
    type: InputActionType.Input,
    input: string,
} | {
    type: InputActionType.Target,
    target: string,
} | {
    type: InputActionType.Domain,
    domain: string | undefined,
} | {
    type: InputActionType.DomainTarget,
    domain: string | undefined,
    target: string,
} | {
    type: InputActionType.InputTarget,
    input: string,
    target: string,
} | { type: InputActionType.Clear }

export function addressInputReducer() {
    return (state: AddressInputState, action: AddressInputAction): AddressInputState => {
        switch (action.type) {
            case InputActionType.Input:
                if (action.input === state.input) {
                    return state;
                }
                try {
                    Address.parse(action.input);
                    return {
                        input: action.input,
                        domain: undefined,
                        target: action.input
                    };
                } catch {
                    // ignore
                }
                return {
                    input: action.input,
                    domain: undefined,
                    target: ''
                };
            case InputActionType.Target:
                return {
                    ...state,
                    target: action.target
                };
            case InputActionType.Domain:
                return {
                    ...state,
                    domain: action.domain
                };
            case InputActionType.DomainTarget:
                return {
                    ...state,
                    domain: action.domain,
                    target: action.target
                };
            case InputActionType.InputTarget:
                return {
                    ...state,
                    input: action.input,
                    target: action.target
                };
            case InputActionType.Clear:
                return {
                    input: '',
                    target: '',
                    domain: undefined
                };
            default:
                return state;
        }
    }
}

export const TransferAddressInput = memo(forwardRef((props: TransferAddressInputProps, ref: ForwardedRef<ATextInputRef>) => {
    const isKnown: boolean = !!KnownWallets(props.isTestnet)[props.target];
    const contact = useContact(props.target);
    const appState = useAppState();
    const theme = useTheme();
    const validAddressFriendly = props.validAddress?.toString({ testOnly: props.isTestnet });
    const [walletSettings,] = useWalletSettings(validAddressFriendly);
    const ledgerTransport = useLedgerTransport();

    const avatarColorHash = walletSettings?.color ?? avatarHash(validAddressFriendly ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const myWallets = appState.addresses
        .map((acc, index) => ({
            address: acc.address,
            addressString: acc.address.toString({ testOnly: props.isTestnet }),
            index: index
        }))
        .concat(ledgerTransport.addr ? [
            {
                address: Address.parse(ledgerTransport.addr.address),
                addressString: Address.parse(ledgerTransport.addr.address).toString({ testOnly: props.isTestnet }),
                index: -2
            }
        ]: [])
        .filter((acc) => !acc.address.equals(props.acc));

    const own = !!myWallets.find((acc) => {
        if (props.validAddress) {
            return acc.address.equals(props.validAddress);
        }
    });

    const select = useCallback(() => {
        (ref as RefObject<ATextInputRef>)?.current?.focus();
    }, [ref]);

    useEffect(() => {
        if (props.isSelected) {
            select();
        }
    }, [select]);

    const isSelected = props.isSelected;

    return (
        <View>
            <View
                style={[isSelected ? { opacity: 0, height: 0, width: 0 } : undefined]}
                pointerEvents={!isSelected ? undefined : 'none'}
            >
                <Pressable
                    style={{
                        backgroundColor: props.theme.surfaceOnElevation,
                        padding: 20,
                        width: '100%', borderRadius: 20,
                        flexDirection: 'row', alignItems: 'center',
                    }}
                    onPress={select}
                >
                    {!!validAddressFriendly
                        ? <Avatar
                            size={46}
                            id={validAddressFriendly}
                            address={validAddressFriendly}
                            borderColor={props.theme.elevation}
                            theme={theme}
                            hash={walletSettings?.avatar}
                            isTestnet={props.isTestnet}
                            backgroundColor={avatarColor}
                            markContact={!!contact}
                            icProps={{ isOwn: own }}
                        />
                        : <Image
                            source={require('@assets/ic-contact.png')}
                            style={{ height: 46, width: 46, tintColor: theme.iconPrimary }}
                        />
                    }
                    <View style={{ paddingHorizontal: 12, flexGrow: 1 }}>
                        <PerfText style={{
                            color: theme.textSecondary,
                            fontSize: 15,
                            lineHeight: 20,
                            fontWeight: '400'
                        }}>
                            {t('common.recipient')}
                        </PerfText>
                        <PerfText style={{
                            color: theme.textPrimary,
                            fontSize: 17,
                            lineHeight: 24,
                            fontWeight: '400',
                            marginTop: 2,
                        }}>
                            {props.target.slice(0, 4) + '...' + props.target.slice(-4)}
                        </PerfText>
                    </View>
                    <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                </Pressable>
            </View>
            <View
                style={[!isSelected ? [{ opacity: 0, height: 0 }, Platform.select({ ios: { width: 0 } })] : {}]}
                pointerEvents={isSelected ? undefined : 'none'}
            >
                <View style={{
                    backgroundColor: props.theme.surfaceOnElevation,
                    paddingVertical: 20,
                    width: '100%', borderRadius: 20,
                    flexDirection: 'row', alignItems: 'center'
                }}>
                    <View style={{ marginLeft: 20 }}>
                        {!!validAddressFriendly
                            ? <Avatar
                                size={46}
                                id={validAddressFriendly}
                                address={validAddressFriendly}
                                borderColor={props.theme.elevation}
                                theme={theme}
                                isTestnet={props.isTestnet}
                                hash={walletSettings?.avatar}
                                backgroundColor={avatarColor}
                                markContact={!!contact}
                                icProps={{ isOwn: own }}
                            />
                            : <Image
                                source={require('@assets/ic-contact.png')}
                                style={{ height: 46, width: 46, tintColor: theme.iconPrimary }}
                            />
                        }
                    </View>
                    <View style={{ flexGrow: 1 }}>
                        <AddressDomainInput
                            input={props.input}
                            dispatch={props.dispatch}
                            target={props.target}
                            index={props.index}
                            ref={ref}
                            autoFocus={true}
                            onFocus={props.onFocus}
                            isKnown={isKnown}
                            onSubmit={props.onSubmit}
                            contact={contact}
                            onQRCodeRead={props.onQRCodeRead}
                            domain={props.domain}
                        />
                    </View>
                </View>
                {!props.validAddress && (props.target.length >= 48) && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <PerfText style={{
                            color: theme.accentRed,
                            fontSize: 13,
                            lineHeight: 18,
                            marginTop: 4,
                            marginLeft: 16,
                            fontWeight: '400'
                        }}>
                            {t('transfer.error.invalidAddress')}
                        </PerfText>
                    </Animated.View>
                )}
                <AddressSearch
                    account={props.acc}
                    onSelect={(item) => {
                        const friendly = item.addr.address.toString({ testOnly: props.isTestnet, bounceable: item.addr.isBounceable });
                        props.dispatch({
                            type: InputActionType.InputTarget,
                            input: item.type !== 'unknown' ? item.title : friendly,
                            target: friendly
                        });
                        if (props.onSearchItemSelected) {
                            props.onSearchItemSelected(item);
                        }
                    }}
                    query={props.input.toLowerCase()}
                    transfer
                    myWallets={myWallets}
                />
            </View>
        </View>
    )
}))