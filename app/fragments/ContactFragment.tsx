import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Platform, View, Text, Image, ScrollView, Alert, KeyboardAvoidingView, Keyboard, TouchableHighlight, LayoutAnimation } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput, ATextInputRef } from "../components/ATextInput";
import { Avatar } from "../components/Avatar";
import { CloseButton } from "../components/CloseButton";
import { ContactField } from "../components/Contacts/ContactField";
import { Item } from "../components/Item";
import { ItemButton } from "../components/ItemButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { confirmAlert } from "../utils/confirmAlert";
import { warn } from "../utils/log";
import { useParams } from "../utils/useParams";
import { useTypedNavigation } from "../utils/useTypedNavigation";

const requiredFields = [
    { key: 'lastName', value: '' },
    { key: 'notes', value: '' },
];

export const ContactFragment = fragment(() => {
    const params = useParams<{ address: string }>();
    const navigation = useTypedNavigation();

    try {
        Address.parse(params.address);
    } catch (e) {
        warn(e);
        navigation.goBack();
    }
    const address = useMemo(() => Address.parse(params.address), []);
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const settings = engine.products.settings;
    const contact = settings.useContact(Address.parse(params.address));

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

    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setFields(contact.fields || requiredFields);
        }
    }, [contact]);


    const onCancel = useCallback(
        () => {
            setEditing(false);
        },
        [],
    );

    const onAction = useCallback(
        () => {
            // Dismiss keyboard for iOS
            if (Platform.OS === 'ios') {
                Keyboard.dismiss();
            }
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

            settings.setContact(address, { name, fields });
            setEditing(false);
        },
        [editing, fields, name, address],
    );

    const onDelete = useCallback(
        async () => {
            const confirmed = await confirmAlert('contacts.delete');
            if (confirmed) {
                settings.removeContact(address);
                navigation.goBack();
            }
        },
        [address],
    );

    const onFieldChange = useCallback((index: number, value: string) => {
        setFields((prev) => {
            const newVal = [...prev];
            newVal[index] = { key: newVal[index].key, value };
            return newVal;
        });
    }, [fields, setFields]);

    // Scroll with Keyboard
    const [selectedInput, setSelectedInput] = React.useState(0);

    const refs = React.useMemo(() => {
        let r: React.RefObject<ATextInputRef>[] = [];
        r.push(React.createRef()); // name input ref
        for (let i = 0; i < fields.length; i++) {
            r.push(React.createRef());
        }
        return r;
    }, [fields]);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();

    const scrollToInput = React.useCallback((index: number) => {
        'worklet';

        if (index === 0) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        scrollTo(scrollRef, 0, Platform.OS === 'android' ? 400 : container.height, true);
        return;

    }, []);

    const keyboard = useKeyboard();
    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    React.useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = React.useCallback((index: number) => {
        console.log({ selected: index });
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = React.useCallback((index: number) => {
        console.log({ index });
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
                        <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                marginVertical: 8,
                                color: Theme.textColor
                            }}>
                                {`${params.address.slice(0, 6) + '...' + params.address.slice(params.address.length - 6)}`}
                            </Text>
                        </View>
                        {!editing && (
                            <View style={{ flexDirection: 'row', marginTop: 17 }} collapsable={false}>
                                <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                                    <TouchableHighlight
                                        onPress={() => {
                                            navigation.navigateSimpleTransfer({
                                                amount: null,
                                                target: address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                                stateInit: null,
                                                job: null,
                                                comment: null,
                                                jetton: null,
                                                callback: null
                                            });
                                        }}
                                        underlayColor={Theme.selector}
                                        style={{ borderRadius: 14 }}
                                    >
                                        <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                            <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                                <Image source={require('../../assets/ic_send.png')} />
                                            </View>
                                            <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                                        </View>
                                    </TouchableHighlight>
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
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
                                        color: '#7D858A',
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
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
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
                            textColor={Theme.dangerZone}
                            backgroundColor={Theme.background}
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
                            onPress={onAction}
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
                        onPress={onAction}
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