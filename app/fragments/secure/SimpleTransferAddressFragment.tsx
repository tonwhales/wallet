import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useFocusEffect } from "@react-navigation/native";
import { AddressInputState, TransferAddressInput } from "../../components/address/TransferAddressInput";
import { ATextInputRef } from "../../components/ATextInput";
import { useRef, useState } from "react";
import { useParams } from "../../utils/useParams";
import { Address } from "@ton/core";
import { useNetwork } from "../../engine/hooks";
import { KnownWallets } from "../../secure/KnownWallets";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useKeyboard } from "@react-native-community/hooks";
import { ScreenHeader } from "../../components/ScreenHeader";

export type SimpleTransferAddressParams = {
    account: string,
    initTarget?: string,
    callback: (value: AddressInputState) => void;
}

export const SimpleTransferAddressFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const addressRef = useRef<ATextInputRef>(null);
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const keyboard = useKeyboard();

    const { initTarget, account, callback } = useParams<SimpleTransferAddressParams>();
    const acc = Address.parse(account);

    const [addressDomainInputState, setAddressDomainInputState] = useState<AddressInputState>(
        {
            input: initTarget || '',
            target: initTarget || '',
            domain: undefined,
            suffix: undefined,
        }
    );

    const { target, input: addressDomainInput, domain } = addressDomainInputState;

    let validAddress: {
        isBounceable: boolean;
        isTestOnly: boolean;
        address: Address;
    } | null = null;

    if (target.length === 48) {
        try {
            validAddress = Address.parseFriendly(target);
        } catch { }
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                title={t('common.recipient')}
                onBackPressed={navigation.goBack}
                onClosePressed={navigation.base.getParent().goBack}
                style={[Platform.select({ android: { paddingTop: safeArea.top } }), { paddingLeft: 16 }]}
            />
            <ScrollView
                // ref={scrollRef}
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={[
                    { marginHorizontal: 16, flexGrow: 1 },
                    // Platform.select({ android: { minHeight: addressInputHeight } }),
                ]}
                contentInset={{
                    // bottom: 0.1,
                    bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - 86 - 32 : 0.1 /* Some weird bug on iOS */, // + 56 + 32
                    top: 0.1 /* Some weird bug on iOS */
                }}
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                automaticallyAdjustContentInsets={false}
            >
                <TransferAddressInput
                    ref={addressRef}
                    acc={acc}
                    target={target}
                    input={addressDomainInput}
                    domain={domain}
                    validAddress={validAddress?.address}
                    isTestnet={isTestnet}
                    index={0}
                    // onFocus={onFocus}
                    setAddressDomainInputState={setAddressDomainInputState}
                    // onSubmit={onSubmit}
                    // onQRCodeRead={onQRCodeRead}
                    // isSelected={selected === 'address'}
                    // onSearchItemSelected={onSearchItemSelected}
                    isSelected={true}
                    knownWallets={knownWallets}
                    navigation={navigation}
                    // autoFocus={true}
                    autoFocus={false}
                    onFocus={() => { }}
                    onSubmit={() => { }} onQRCodeRead={() => { }}
                />
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[
                    { marginHorizontal: 16, marginTop: 16, },
                    Platform.select({
                        android: { marginBottom: safeArea.bottom + 16 },
                        ios: { marginBottom: safeArea.bottom }
                    })
                ]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 16 : 0}
            >
                <RoundButton
                    title={t('common.save')}
                    disabled={!validAddress}
                    onPress={() => {
                        navigation.goBack();
                        callback(addressDomainInputState);
                    }}
                />
            </KeyboardAvoidingView>
        </View>
    );
});