import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import { Platform, ScrollView, View, Image } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { Avatar } from "../Avatar";
import { AddressDomainInput } from "./AddressDomainInput";
import { ATextInputRef } from "../ATextInput";
import { KnownWallets } from "../../secure/KnownWallets";
import { useContact } from "../../engine/hooks";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useKeyboard } from "@react-native-community/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddressSearch } from "./AddressSearch";

import IcSpamNonen from '@assets/ic-spam-none.svg';

type TransferAddressInputProps = {
    acc: Address,
    theme: ThemeType,
    validAddress?: Address,
    isTestnet: boolean,
    index: number,
    target: string,
    input: string,
    dispatch: (action: AddressInputAction) => void,
    onFocus: (index: number) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
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
        console.log({ action });
        switch (action.type) {
            case InputActionType.Input:
                if (action.input === state.input) {
                    return state;
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
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();

    useEffect(() => {
        if (props.isSelected) {
            (ref as ForwardedRef<ATextInputRef>)?.current?.focus();
        }
    }, [props.isSelected, ref]);

    return (
        <>
            <View style={{
                backgroundColor: props.theme.surfaceOnElevation,
                paddingVertical: 20,
                width: '100%', borderRadius: 20,
                flexDirection: 'row', alignItems: 'center'
            }}>
                <View style={{ marginLeft: 20 }}>
                    {!!props.validAddress
                        ? <Avatar
                            size={46}
                            id={props.validAddress.toString({ testOnly: props.isTestnet })}
                            address={props.validAddress.toString({ testOnly: props.isTestnet })}
                            backgroundColor={props.theme.elevation}
                            borderColor={props.theme.elevation}
                        />
                        : <IcSpamNonen height={46} width={46} style={{ height: 46, width: 46 }} />
                    }
                </View>
                <View style={{ flexGrow: 1 }}>
                    <AddressDomainInput
                        input={props.input}
                        dispatch={props.dispatch}
                        target={props.target}
                        index={props.index}
                        ref={ref}
                        onFocus={props.onFocus}
                        style={{ paddingHorizontal: 16, flexGrow: 1 }}
                        inputStyle={{
                            flexShrink: 1,
                            fontSize: 17, fontWeight: '400',
                            color: props.theme.textPrimary,
                            textAlignVertical: 'center',
                        }}
                        isKnown={isKnown}
                        onSubmit={props.onSubmit}
                        contact={contact}
                        onQRCodeRead={props.onQRCodeRead}
                        invalid={!props.validAddress}
                    />
                </View>
            </View>
            {props.isSelected && (
                <Animated.View
                    style={{ marginHorizontal: -16 }}
                    entering={FadeIn} exiting={FadeOut}
                >
                    <ScrollView
                        contentInset={{
                            top: 16,
                            bottom: keyboard.keyboardHeight + safeArea.bottom + 16 + 56,
                        }}
                        contentContainerStyle={[
                            { marginHorizontal: 16, borderRadius: 20 },
                            Platform.select({ android: { paddingTop: 32 } }),
                        ]}
                        style={{ flexGrow: 1, minHeight: 256, marginTop: 16 }}
                        contentInsetAdjustmentBehavior={'never'}
                        keyboardShouldPersistTaps={'always'}
                        keyboardDismissMode={'none'}
                    >
                        <AddressSearch
                            account={props.acc}
                            onSelect={(item) => {
                                console.log(item);
                                props.dispatch({
                                    type: InputActionType.InputTarget,
                                    input: item.type !== 'unknown' ? item.title : item.address.toString({ testOnly: props.isTestnet }),
                                    target: item.address.toString({ testOnly: props.isTestnet })
                                })
                            }}
                            query={props.input}
                            transfer
                        />
                    </ScrollView>
                </Animated.View>
            )}
        </>
    )
}))