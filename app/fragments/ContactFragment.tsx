import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert, KeyboardAvoidingView, Keyboard } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput, ATextInputRef } from "../components/ATextInput";
import { Avatar } from "../components/Avatar";
import { CloseButton } from "../components/CloseButton";
import { Item } from "../components/Item";
import { ItemButton } from "../components/ItemButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
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
        },
        [editing, fields, name, address],
    );

    const onDelete = useCallback(
        () => {
            // TODO add alert
            settings.removeContact(address);
        },
        [address],
    );

    const onFieldChange = useCallback((index: number, value: string) => {
        setFields((prev) => {
            if (prev[index].value !== value) {
                prev[index] = { ...prev[index], value };
            }
            return prev;
        })
    }, [fields, setFields]);

    // Scroll with Keyboard
    const [selectedInput, setSelectedInput] = React.useState(0);

    const refs = React.useMemo(() => {
        let r: React.RefObject<ATextInputRef>[] = [];
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
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = React.useCallback((index: number) => {
        let next = refs[index + 1].current;
        if (next) {
            next.focus();
        }
    }, []);


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
                            onSubmit={onSubmit}
                            returnKeyType={'next'}
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
                            const [value, setValue] = useState(field.value || '');
                            return (
                                <>
                                    <ATextInput
                                        key={`input-${index}`}
                                        index={index + 1}
                                        ref={refs[index + 1]}
                                        onFocus={onFocus}
                                        onSubmit={onSubmit}
                                        returnKeyType={'next'}
                                        blurOnSubmit={false}
                                        value={value}
                                        onValueChange={(value: string) => {
                                            setValue(value);
                                            onFieldChange(index, value);
                                        }}
                                        // placeholder={t('contacts.lastName')}
                                        placeholder={field.key}
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
                                                    {field.key}
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
                                    {(index < fields.length - 1) && (
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                                    )}
                                </>
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
                <RoundButton
                    title={t(
                        !!contact
                            ? !editing
                                ? 'contacts.edit'
                                : 'contacts.save'
                            : 'contacts.add'
                    )}
                    disabled={editing && !hasChanges}
                    onPress={onAction}
                    display={editing && !hasChanges ? 'secondary' : 'default'}
                />

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