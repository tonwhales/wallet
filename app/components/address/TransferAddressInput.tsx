import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, View } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { avatarColors } from "../Avatar";
import { AddressDomainInput } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallets } from "../../secure/KnownWallets";
import { useAppState, useTheme, useWalletSettings } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AddressSearch, AddressSearchItem } from "./AddressSearch";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { avatarHash } from "../../utils/avatarHash";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { AddressInputAvatar } from "./AddressInputAvatar";
import { useDimensions } from "@react-native-community/hooks";

import IcChevron from '@assets/ic_chevron_forward.svg';

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
    const addressBookContext = useAddressBookContext();
    const contact = addressBookContext.asContact(props.target);
    const appState = useAppState();
    const theme = useTheme();
    const dimentions = useDimensions();
    const screenWidth = dimentions.screen.width;
    const validAddressFriendly = props.validAddress?.toString({ testOnly: props.isTestnet });
    const [walletSettings,] = useWalletSettings(validAddressFriendly);
    const ledgerTransport = useLedgerTransport();

    const avatarColorHash = walletSettings?.color ?? avatarHash(validAddressFriendly ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const isSelectedLedger = useMemo(() => {
        try {
            if (!!ledgerTransport?.addr?.address && !!props.validAddress) {
                return Address.parse(ledgerTransport.addr.address).equals(props.validAddress);
            }
            return false
        } catch {
            return false;
        }
    }, [ledgerTransport.addr?.address, props.validAddress]);

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
        ] : [])
        .filter((acc) => !acc.address.equals(props.acc));

    const own = !!myWallets.find((acc) => {
        if (props.validAddress) {
            return acc.address.equals(props.validAddress);
        }
    });

    const isSelected = props.isSelected;

    const select = useCallback(() => {
        (ref as RefObject<ATextInputRef>)?.current?.focus();
    }, []);

    useEffect(() => {
        if (isSelected) {
            select();
        }
    }, [select, isSelected]);


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
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isTestnet={props.isTestnet}
                        isOwn={own}
                        markContact={!!contact}
                        hash={walletSettings?.avatar}
                        isLedger={isSelectedLedger}
                        friendly={validAddressFriendly}
                        avatarColor={avatarColor}
                    />
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
                style={
                    !isSelected
                        ? Platform.select({
                            ios: { width: 0, height: 0, opacity: 0 },
                            android: { height: 1, opacity: 0 } // to account for wierd android behavior (not focusing on input when it's height/width is 0)
                        })
                        : { height: 'auto', width: '100%', opacity: 1 }
                }
                pointerEvents={isSelected ? undefined : 'none'}
            >
                <View style={{
                    backgroundColor: props.theme.surfaceOnElevation,
                    paddingVertical: 20,
                    paddingHorizontal: 20,
                    width: '100%', borderRadius: 20,
                    flexDirection: 'row', alignItems: 'center',
                    gap: 16
                }}>
                    <AddressInputAvatar
                        size={46}
                        theme={theme}
                        isTestnet={props.isTestnet}
                        isOwn={own}
                        markContact={!!contact}
                        hash={walletSettings?.avatar}
                        isLedger={isSelectedLedger}
                        friendly={validAddressFriendly}
                        avatarColor={avatarColor}
                    />
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
                        screenWidth={screenWidth * 0.75}
                    />
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
                        let name = item.type !== 'unknown' ? item.title : friendly;

                        if (item.isLedger) {
                            name = 'Ledger';
                        }

                        props.dispatch({
                            type: InputActionType.InputTarget,
                            input: name.trim(),
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