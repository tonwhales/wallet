import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import { ScrollView, View } from "react-native";
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
    setInput: (value: string) => void,
    onFocus: (index: number) => void,
    setTarget: (value: string) => void,
    setDomain: (value: string | undefined) => void,
    onSubmit: (index: number) => void,
    onQRCodeRead: (value: string) => void,
    isSelected?: boolean,
    onNext?: () => void,
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
                        onInputChange={props.setInput}
                        target={props.target}
                        index={props.index}
                        ref={ref}
                        onFocus={props.onFocus}
                        onTargetChange={props.setTarget}
                        onDomainChange={props.setDomain}
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
                    style={{ marginTop: 32, marginHorizontal: -16 }}
                    entering={FadeIn} exiting={FadeOut}
                >
                    <ScrollView
                        contentInset={{
                            bottom: keyboard.keyboardHeight - safeArea.bottom - 16 - 56 - safeArea.top,
                            top: 0.1 /* Some weird bug on iOS */
                        }}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        contentInsetAdjustmentBehavior={'never'}
                        keyboardShouldPersistTaps={'always'}
                        keyboardDismissMode={'none'}
                    >
                        <AddressSearch
                            account={props.acc}
                            onSelect={(address) => {
                                props.setInput(address.toString({ testOnly: props.isTestnet }));
                                props.setTarget(address.toString({ testOnly: props.isTestnet }));
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