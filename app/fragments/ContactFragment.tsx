import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar } from "expo-status-bar";
import React, { RefObject, createRef, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, Image, Alert, Keyboard, TouchableHighlight, Pressable, TextInput } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { Avatar } from "../components/Avatar";
import { ContactField } from "../components/Contacts/ContactField";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { useParams } from "../utils/useParams";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { useScreenHeader } from "../components/ScreenHeader";
import { copyText } from "../utils/copyText";
import { ItemDivider } from "../components/ItemDivider";
import Share from 'react-native-share';

import CopyIcon from '../../assets/ic-copy.svg';

const requiredFields = [
    { key: 'lastName', value: '' },
    { key: 'notes', value: '' },
];

export const ContactFragment = fragment(() => {
    const params = useParams<{ address: string, isNew?: boolean }>();
    const navigation = useTypedNavigation();
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const settings = engine.products.settings;

    const [address, setAddress] = useState(params.address ?? '');
    const parsed = useMemo(() => {
        try {
            return Address.parse(address);
        } catch {
            return null;
        }
    }, [address]);
    const contact = settings.useContactAddress(params.isNew ? null : parsed);
    const [editing, setEditing] = useState(!contact || params.isNew);
    const [name, setName] = useState(contact?.name);
    const [fields, setFields] = useState(contact?.fields || requiredFields);

    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setFields(contact.fields || requiredFields);
        }
    }, [contact]);

    const onAction = useCallback(
        () => {
            if (!editing) {
                setEditing(true);
                return;
            }
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

            settings.setContact(parsed, { name, fields });
            setEditing(false);
        },
        [editing, fields, name, parsed],
    );

    const onDelete = useCallback(
        async () => {
            if (!parsed) {
                return;
            }
            const confirmed = await confirmAlert('contacts.delete');
            if (confirmed) {
                settings.removeContact(parsed);
                navigation.goBack();
            }
        },
        [parsed],
    );

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
        let r: RefObject<TextInput>[] = [];
        if (params.isNew) r.push(createRef<TextInput>()); // address input ref
        r.push(createRef<TextInput>()); // name input ref
        for (let i = 0; i < fields.length; i++) {
            r.push(createRef<TextInput>());
        }
        return r;
    }, [fields, params.isNew]);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<Animated.View>();
    const scrollToInput = useCallback((index: number) => {
        'worklet';

        if (index === 0) {
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

    const onCopy = useCallback(() => {
        if (!parsed) {
            return;
        }
        copyText(parsed.toFriendly({ testOnly: AppConfig.isTestnet }));
    }, [parsed]);

    const onShare = useCallback(() => {
        if (!parsed) {
            return;
        }
        Share.open({
            title: t('contacts.title'),
            message: `${name} \n${parsed.toFriendly({ testOnly: AppConfig.isTestnet })}`
        });
    }, [parsed]);

    const ready = useMemo(() => {
        if (!params.isNew || !parsed || name?.length === 0) {
            return false;
        }
        return true;
    }, [params]);

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

    const canSave = useMemo(() => {
        if (editing && !params.isNew) {
            return hasChanges;
        }
        return params.isNew && ready;
    }, [editing, hasChanges, params, ready]);

    const reset = useCallback(() => {
        setEditing(false);
        setFields(contact?.fields || requiredFields);
        setName(contact?.name);
    }, []);

    useScreenHeader(
        navigation,
        Theme,
        {
            title: t('contacts.title'),
            headerShown: true,
            headerLargeTitle: true,
            tintColor: Theme.accent,
            rightButton: (
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                        }
                    }}
                    onPress={onAction}
                    hitSlop={
                        Platform.select({
                            ios: undefined,
                            default: { top: 16, right: 16, bottom: 16, left: 16 },
                        })
                    }
                    disabled={editing ? !canSave : false}
                >
                    <Text style={{
                        color: editing
                            ? canSave
                                ? Theme.accent
                                : Theme.darkGrey
                            : Theme.accent,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                    }}>
                        {editing ? t('contacts.save') : t('contacts.edit')}
                    </Text>
                </Pressable>
            ),
            onBackPressed: (editing && !params.isNew)
                ? reset
                : navigation.goBack,
        }
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom + 44 + 16) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
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
                            <Avatar address={address} id={address} size={100} image={undefined} backgroundColor={Theme.accent} />
                        </View>
                        {!editing && (
                            <>
                                <Text style={{
                                    fontSize: 32, lineHeight: 38,
                                    fontWeight: '600',
                                    color: Theme.textColor,
                                    marginTop: 16
                                }}>
                                    {name}
                                </Text>
                                <Pressable
                                    onPress={onCopy}
                                    style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Text style={{
                                        fontSize: 17, lineHeight: 24,
                                        fontWeight: '400',
                                        marginTop: 4,
                                        color: Theme.darkGrey
                                    }}>
                                        {`${address.slice(0, 6) + '...' + address.slice(address.length - 6)}`}
                                    </Text>
                                    <CopyIcon style={{ height: 12, width: 12, marginLeft: 12 }} height={12} width={12} color={Theme.greyForIcon} />
                                </Pressable>
                            </>
                        )}
                        {!editing && !!parsed && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: 24,
                                    backgroundColor: Theme.lightGrey,
                                    width: '100%',
                                    justifyContent: 'center', alignItems: 'center',
                                    borderRadius: 20,
                                    padding: 10
                                }}
                            >
                                <TouchableHighlight
                                    onPress={() => {
                                        navigation.navigate(
                                            'Assets',
                                            { target: parsed.toFriendly({ testOnly: AppConfig.isTestnet }) }
                                        );
                                    }}
                                    underlayColor={Theme.selector}
                                    style={{ borderRadius: 14, padding: 10, flexGrow: 1 }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View
                                            style={{
                                                backgroundColor: Theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <Image source={require('../../assets/ic_send.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: Theme.textColor,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}>
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={onShare}
                                    underlayColor={Theme.selector}
                                    style={{ borderRadius: 14, padding: 10, flexGrow: 1 }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View
                                            style={{
                                                backgroundColor: Theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            {/* <ShareIcon height={24} width={24} color={'white'} style={{ height: 12, width: 12 }} /> */}
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: Theme.textColor,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}>
                                            {t('common.share')}
                                        </Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                        )}
                    </View>

                    {editing && (
                        <>
                            {!params.isNew && (
                                <View style={{
                                    backgroundColor: Theme.lightGrey,
                                    paddingHorizontal: 20, marginTop: 20,
                                    paddingVertical: 10,
                                    width: '100%', borderRadius: 20
                                }}>
                                    <View style={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        marginBottom: 2
                                    }}>
                                        <Text style={{ color: Theme.darkGrey, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                                            {t('common.walletAddress')}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 17, lineHeight: 24,
                                        fontWeight: '400',
                                        marginTop: 4,
                                        color: Theme.darkGrey
                                    }}>
                                        {`${address.slice(0, 6) + '...' + address.slice(address.length - 6)}`}
                                    </Text>
                                </View>
                            )}
                            {params.isNew && (
                                <View style={{
                                    backgroundColor: Theme.lightGrey,
                                    paddingHorizontal: 20, marginTop: 20,
                                    paddingVertical: 10,
                                    width: '100%', borderRadius: 20
                                }}>
                                    <View style={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        marginBottom: 2
                                    }}>
                                        <Text style={{ color: Theme.darkGrey, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                                            {t('common.walletAddress')}
                                        </Text>
                                    </View>
                                    <TextInput
                                        ref={refs[0]}
                                        style={[
                                            {
                                                paddingHorizontal: 0,
                                                textAlignVertical: 'top',
                                                fontSize: 17, lineHeight: 24,
                                                fontWeight: '400', color: Theme.textColor
                                            }
                                        ]}
                                        maxLength={48}
                                        placeholder={t('common.walletAddress')}
                                        placeholderTextColor={Theme.placeholder}
                                        multiline={true}
                                        blurOnSubmit={true}
                                        editable={true}
                                        value={address}
                                        onChangeText={setAddress}
                                        onSubmitEditing={() => onSubmit(0)}
                                        onFocus={() => onFocus(0)}
                                    />
                                </View>
                            )}

                            <View style={{
                                backgroundColor: Theme.lightGrey,
                                paddingHorizontal: 20, marginTop: 20,
                                paddingVertical: 10,
                                width: '100%', borderRadius: 20
                            }}>
                                <Pressable
                                    onPress={() => {
                                        if (refs[params.isNew ? 1 : 0]) {
                                            refs[params.isNew ? 1 : 0].current?.focus();
                                        }
                                    }}
                                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                                >
                                    <View style={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        marginBottom: 2
                                    }}>
                                        <Text style={{ color: Theme.darkGrey, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                                            {t('contacts.name')}
                                        </Text>
                                    </View>
                                    <TextInput
                                        ref={refs[params.isNew ? 1 : 0]}
                                        style={[
                                            {
                                                paddingVertical: 0,
                                                paddingHorizontal: 0,
                                                textAlignVertical: 'top',
                                                fontSize: 17, lineHeight: 24,
                                                fontWeight: '400', color: Theme.textColor
                                            }
                                        ]}
                                        maxLength={126}
                                        placeholder={t('contacts.name')}
                                        placeholderTextColor={Theme.placeholder}
                                        multiline={false}
                                        blurOnSubmit={true}
                                        editable={editing}
                                        value={name}
                                        onChangeText={setName}
                                        onSubmitEditing={() => onSubmit(params.isNew ? 1 : 0)}
                                        onFocus={() => onFocus(params.isNew ? 1 : 0)}
                                    />
                                </Pressable>

                                {fields.map((field, index) => {
                                    return (
                                        <>
                                            <ItemDivider marginHorizontal={0} />
                                            <ContactField
                                                fieldKey={field.key}
                                                key={`input-${index}`}
                                                index={index + (params.isNew ? 2 : 1)}
                                                ref={refs[index + (params.isNew ? 2 : 1)]}
                                                input={{
                                                    value: field.value || '',
                                                    onFocus: onFocus,
                                                    onSubmit: onSubmit,
                                                    editable: editing,
                                                    enabled: editing
                                                }}
                                                onFieldChange={onFieldChange}
                                            />
                                        </>
                                    )
                                })}
                            </View>
                            {!!contact && (
                                <RoundButton
                                    display={'danger_zone_text'}
                                    onPress={onDelete}
                                    title={t('contacts.delete')}
                                    style={{ marginTop: 16 }}

                                />
                            )}
                        </>
                    )}
                </Animated.View>
            </Animated.ScrollView>
        </View>
    )
});