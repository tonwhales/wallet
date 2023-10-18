import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar } from "expo-status-bar";
import React, { RefObject, createRef, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Platform, View, Text, Image, Alert, KeyboardAvoidingView, Keyboard, TouchableHighlight, LayoutAnimation } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInput, ATextInputRef } from "../components/ATextInput";
import { Avatar } from "../components/Avatar";
import { CloseButton } from "../components/CloseButton";
import { ContactField } from "../components/Contacts/ContactField";
import { Item } from "../components/Item";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { warn } from "../utils/log";
import { useParams } from "../utils/useParams";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useTheme } from '../engine/hooks/useTheme';
import { useNetwork } from '../engine/hooks/useNetwork';
import { useContactAddress } from '../engine/hooks/contacts/useContactAddress';
import { useSetContact } from "../engine/effects/useSetContact";
import { useRemoveContact } from "../engine/effects/useRemoveContact";

const requiredFields = [
    { key: 'lastName', value: '' },
    { key: 'notes', value: '' },
];

export const ContactFragment = fragment(() => {
    const params = useParams<{ address: string }>();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    try {
        Address.parse(params.address);
    } catch (e) {
        warn(e);
        navigation.goBack();
    }
    const address = useMemo(() => Address.parse(params.address), []);
    const setContact = useSetContact();
    const removeContact = useRemoveContact();
    const safeArea = useSafeAreaInsets();
    const contact = useContactAddress(Address.parse(params.address));

    const [editing, setEditing] = useState(!contact);
    const [name, setName] = useState(contact?.name);
    const [fields, setFields] = useState(contact?.fields || requiredFields);

    const hasChanges = useMemo(() => {
        if (name !== contact?.name) {
            return true;
        }
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].value !== (contact?.fields || [])[i]?.value) {
                return true;
            }
        }
        return false
    }, [fields, name, contact]);

    const onSave = useCallback(async () => {
        if (!editing) {
            setEditing(true);
            return;
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

        try {
            await setContact(address.toString({ testOnly: isTestnet }), { name, fields });
        } catch {
            Alert.alert(t('errors.title'), t('errors.unknown'));
        }
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }
        setEditing(false);
    }, [editing, fields, name, address, isTestnet]);

    const onDelete = useCallback(async () => {
        const confirmed = await confirmAlert('contacts.delete');
        if (confirmed) {
            removeContact(address.toString({ testOnly: isTestnet }));
            navigation.goBack();
        }
    }, [address, isTestnet]);

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
        r.push(createRef()); // name input ref
        for (let i = 0; i < fields.length; i++) {
            r.push(createRef());
        }
        return r;
    }, [fields]);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();

    const scrollToInput = useCallback((index: number) => {
        'worklet';

        if (index === 0) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        if (Platform.OS !== 'android' && container) {
            scrollTo(scrollRef, 0, container.height, true);
        }
        if (Platform.OS === 'android') {
            scrollTo(scrollRef, 0, 400, true);
        }
        return;

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
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = useCallback((index: number) => {
        let next = refs[index + 1]?.current;
        if (next) {
            next.focus();
        }
    }, [refs]);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [editing]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('contacts.contact')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('contacts.contact')}
                    </Text>
                </View>
            )}
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar address={params.address} id={params.address} size={84} image={undefined} />
                        </View>
                        <View style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                marginVertical: 8,
                                color: theme.textColor
                            }}>
                                {`${params.address.slice(0, 6) + '...' + params.address.slice(params.address.length - 6)}`}
                            </Text>
                        </View>
                        {!editing && (
                            <View style={{ flexDirection: 'row', marginTop: 17 }} collapsable={false}>
                                <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: theme.item, borderRadius: 14 }}>
                                    <TouchableHighlight
                                        onPress={() => {
                                            navigation.navigate(
                                                'Assets',
                                                { target: address.toString({ testOnly: isTestnet }) }
                                            );
                                        }}
                                        underlayColor={theme.selector}
                                        style={{ borderRadius: 14 }}
                                    >
                                        <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                            <View style={{ backgroundColor: theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                                <Image source={require('../../assets/ic_send.png')} />
                                            </View>
                                            <Text style={{ fontSize: 13, color: theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                                        </View>
                                    </TouchableHighlight>
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ATextInput
                            index={0}
                            ref={refs[0]}
                            onFocus={onFocus}
                            value={name}
                            onSubmit={() => {
                                onSubmit(0)
                            }}
                            blurOnSubmit={false}
                            onValueChange={setName}
                            placeholder={t('contacts.name')}
                            keyboardType={'default'}
                            editable={editing}
                            enabled={editing}
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
                                        color: theme.label,
                                        alignSelf: 'flex-start',
                                    }}>
                                        {t('contacts.name')}
                                    </Text>
                                </View>
                            }
                            multiline
                            autoCorrect={false}
                            autoComplete={'off'}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 15 }} />
                        {fields.map((field, index) => {
                            return (
                                <ContactField
                                    fieldKey={field.key}
                                    key={`input-${index}`}
                                    index={index + 1}
                                    refs={refs}
                                    input={{
                                        value: field.value || '',
                                        onFocus: onFocus,
                                        onSubmit: onSubmit,
                                        editable: editing,
                                        enabled: editing
                                    }}
                                    onFieldChange={onFieldChange}
                                />
                            )
                        })}
                    </View>
                    {editing && !!contact && (
                        <Item
                            textColor={theme.dangerZone}
                            backgroundColor={theme.background}
                            title={t('contacts.delete')}
                            onPress={onDelete}
                        />
                    )}
                </View>
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    {editing && (
                        <RoundButton
                            title={t('common.cancel')}
                            disabled={!editing}
                            action={onSave}
                            display={'secondary'}
                            style={{ flexGrow: 1, marginRight: 8 }}
                        />
                    )}
                    <RoundButton
                        title={t(
                            !!contact
                                ? !editing
                                    ? 'contacts.edit'
                                    : 'contacts.save'
                                : 'contacts.add'
                        )}
                        style={{ flexGrow: 1 }}
                        disabled={editing && !hasChanges}
                        action={onSave}
                        display={editing && !hasChanges ? 'secondary' : 'default'}
                    />
                </View>

            </KeyboardAvoidingView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    )
});