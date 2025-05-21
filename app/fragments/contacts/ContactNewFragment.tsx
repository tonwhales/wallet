import { useKeyboard } from "@react-native-community/hooks";
import React, { RefObject, createRef, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, Alert, Keyboard, KeyboardAvoidingView, ScrollView } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContactField } from "../../components/Contacts/ContactField";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemDivider } from "../../components/ItemDivider";
import { ATextInput, ATextInputRef } from "../../components/ATextInput";
import { useNetwork, useSetContact, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { useParams } from "../../utils/useParams";
import { Avatar } from "../../components/avatar/Avatar";
import { useKnownWallets } from "../../secure/KnownWallets";
import { Typography } from "../../components/styles";

export const requiredFields = [
    { key: 'notes', value: '' }
];

export const ContactNewFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = useKnownWallets(isTestnet);
    const { address: passedAddress } = useParams<{ address?: string }>();

    const [address, setAddress] = useState(passedAddress ?? '');
    const parsed = useMemo(() => {
        try {
            return Address.parseFriendly(address);
        } catch {
            return null;
        }
    }, [address]);

    const setContact = useSetContact();
    const safeArea = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [fields, setFields] = useState(requiredFields);

    const onAction = useCallback(async () => {
        if (!parsed) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        if (!name || name.length > 126) {
            Alert.alert(t('contacts.alert.name'), t('contacts.alert.nameDescription'))
            return;
        }

        for (let field of fields) {
            if (field.value && field.value.length > 280) {
                Alert.alert(
                    t('contacts.alert.notes'),
                    t('contacts.alert.notesDescription')
                );
                return;
            }
        }

        await setContact(
            parsed.address.toString({ testOnly: isTestnet }),
            { name, fields }
        );

        navigation.replace(
            'Contact',
            { address: parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }) }
        );

    }, [fields, name, parsed, isTestnet, setContact]);

    const onFieldChange = useCallback((index: number, value: string) => {
        setFields((prev) => {
            const newVal = [...prev];
            newVal[index] = { key: newVal[index].key, value };
            return newVal;
        });
    }, [fields, setFields]);

    // Scroll with Keyboard
    const [selectedInput, setSelectedInput] = useState(0);
    const refs = useMemo(() => {
        let r: RefObject<ATextInputRef>[] = [];
        r.push(createRef<ATextInputRef>()); // address input ref
        r.push(createRef<ATextInputRef>()); // name input ref
        for (let i = 0; i < fields.length; i++) {
            r.push(createRef<ATextInputRef>());
        }
        return r;
    }, [fields]);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<Animated.View>();
    const scrollToInput = useCallback((index: number) => {
        'worklet';

        if (index === 1) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        if (container) {
            scrollTo(scrollRef, 0, container.height - 44 * (index + 1), true);
        } else {
            scrollTo(scrollRef, 0, 500, true);
        }
    }, []);

    const keyboard = useKeyboard();
    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = useCallback((index: number) => {
        setSelectedInput(index);
        runOnUI(scrollToInput)(index);
    }, []);

    const onSubmit = useCallback((index: number) => {
        let next = refs[index + 1]?.current;
        if (next) {
            next.focus();
        }
    }, [refs]);

    const ready = useMemo(() => {
        if (!parsed || !name || name?.length === 0) {
            return false;
        }
        return true;
    }, [name, parsed]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('contacts.title')}
                style={{ paddingLeft: 16 }}
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{
                    bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom + 44 + 56) : 0.1 /* Some weird bug on iOS */,
                    top: 0.1 /* Some weird bug on iOS */
                }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                keyboardDismissMode={'none'}
            >
                <Animated.View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 0, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                            <Avatar
                                address={parsed ? parsed.address.toString({ testOnly: isTestnet }) : ''}
                                id={parsed ? parsed.address.toString({ testOnly: isTestnet }) : ''}
                                size={100}
                                image={undefined}
                                borderWidth={2}
                                borderColor={theme.surfaceOnElevation}
                                theme={theme}
                                knownWallets={knownWallets}
                                hashColor
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        marginTop: 20,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20
                    }}>
                        <ATextInput
                            ref={refs[1]}
                            value={name}
                            onValueChange={(newValue) => setName(newValue.trimStart())}
                            label={t('contacts.name') + ` (${t('common.required')})`}
                            style={{ paddingHorizontal: 16 }}
                            blurOnSubmit={true}
                            editable={true}
                            index={1}
                            onFocus={onFocus}
                            cursorColor={theme.accent}
                        />
                    </View>
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        marginTop: 20,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20
                    }}>
                        <ATextInput
                            ref={refs[0]}
                            value={address}
                            style={{ paddingHorizontal: 16 }}
                            keyboardType={'ascii-capable'}
                            onValueChange={(newValue) => setAddress(newValue.trim())}
                            label={t('common.walletAddress') + ` (${t('common.required')})`}
                            blurOnSubmit={true}
                            editable={true}
                            multiline
                            index={0}
                            onFocus={onFocus}
                            cursorColor={theme.accent}
                        />
                    </View>
                    {address.length >= 48 && !parsed && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Text style={[{
                                color: theme.accentRed,
                                marginTop: 8,
                                marginLeft: 16
                            }, Typography.regular13_18]}>
                                {t('transfer.error.invalidAddress')}
                            </Text>
                        </Animated.View>
                    )}

                    {fields.length > 0 && (
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginTop: 20,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20
                        }}>
                            {fields.map((field, index) => {
                                return (
                                    <View key={`input-${index}`}>
                                        <ContactField
                                            fieldKey={field.key}
                                            index={index}
                                            ref={refs[index + 2]}
                                            input={{
                                                value: field.value || '',
                                                onFocus: onFocus,
                                                onSubmit: onSubmit,
                                                editable: true,
                                                enabled: true
                                            }}
                                            onFieldChange={onFieldChange}
                                        />
                                        {index !== fields.length - 1 && (
                                            <View style={{ marginHorizontal: 16 }}>
                                                <ItemDivider marginHorizontal={0} />
                                            </View>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{ paddingHorizontal: 16, marginBottom: safeArea.bottom + 16 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 16}
            >
                <RoundButton
                    display={'default'}
                    action={onAction}
                    title={t('contacts.save')}
                    disabled={!ready}
                />
            </KeyboardAvoidingView>
        </View>
    );
});