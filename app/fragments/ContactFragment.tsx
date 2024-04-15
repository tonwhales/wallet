import { useKeyboard } from "@react-native-community/hooks";
import React, { RefObject, createRef, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, View, Text, Image, Alert, Keyboard, Pressable, TextInput } from "react-native";
import Animated, { runOnUI, useAnimatedRef, useSharedValue, measure, scrollTo, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { ContactField } from "../components/Contacts/ContactField";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { confirmAlert } from "../utils/confirmAlert";
import { useParams } from "../utils/useParams";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ScreenHeader } from "../components/ScreenHeader";
import { copyText } from "../utils/copyText";
import { ItemDivider } from "../components/ItemDivider";
import Share from 'react-native-share';
import { ToastDuration, useToaster } from "../components/toast/ToastProvider";
import { ATextInput } from "../components/ATextInput";
import { useBounceableWalletFormat, useNetwork, useTheme } from "../engine/hooks";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { useContractInfo } from "../engine/hooks/metadata/useContractInfo";
import { useAddressBookContext } from "../engine/AddressBookContext";

import CopyIcon from '@assets/ic-copy.svg';
import ShareIcon from '@assets/ic-share-contact.svg';

const requiredFields = [
    { key: 'lastName', value: '' },
    { key: 'notes', value: '' },
];

export const ContactFragment = fragment(() => {
    const toaster = useToaster();
    const params = useParams<{ address?: string, isNew?: boolean }>();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const [address, setAddress] = useState(params.address ?? '');
    const parsed = useMemo(() => {
        try {
            return Address.parseFriendly(address);
        } catch {
            return null;
        }
    }, [address]);

    const safeArea = useSafeAreaInsets();
    const addressBookContext = useAddressBookContext();
    const contact = addressBookContext.asContact(params.address);
    const setContact = addressBookContext.setContact;
    const removeContact = addressBookContext.removeContact;
    const contractInfo = useContractInfo(params.address ?? '');

    const [bounceableFormat,] = useBounceableWalletFormat();
    const [editing, setEditing] = useState(!contact);
    const [name, setName] = useState(contact?.name);
    const [fields, setFields] = useState(contact?.fields || requiredFields);

    const shortAddressStr = useMemo(() => {
        if (!parsed || (params.isNew && editing)) {
            return null;
        }
        const bounceable = (contractInfo?.kind === 'wallet')
            ? bounceableFormat
            : true;
        const friendly = parsed.address.toString({ testOnly: isTestnet, bounceable });
        return `${friendly.slice(0, 6) + '...' + friendly.slice(friendly.length - 6)}`;
    }, [params.isNew, contractInfo, bounceableFormat, parsed, isTestnet, editing]);

    const onAction = useCallback(() => {
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

        setContact(parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }), { name, fields });
        setEditing(false);
    }, [editing, fields, name, parsed]);

    const onDelete = useCallback(async () => {
        if (!parsed) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }
        const confirmed = await confirmAlert('contacts.delete');
        if (confirmed) {
            removeContact(parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }));
            navigation.goBack();
        }
    }, [parsed]);

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
        copyText(parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }));

        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
            }
        );
    }, [parsed]);

    const onShare = useCallback(() => {
        if (!parsed) {
            return;
        }
        Share.open({
            title: t('contacts.title'),
            message: `${name} \n${parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable })}`
        });
    }, [parsed]);

    const ready = useMemo(() => {
        if (!params.isNew || !parsed || !name || name?.length === 0) {
            return false;
        }
        return true;
    }, [params, name, parsed]);

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
            <Animated.ScrollView
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
                                borderWith={2}
                                borderColor={theme.surfaceOnElevation}
                                theme={theme}
                                isTestnet={isTestnet}
                                hashColor
                            />
                        </View>
                        {!editing && (
                            <>
                                <Text style={{
                                    fontSize: 32, lineHeight: 38,
                                    fontWeight: '600',
                                    color: theme.textPrimary,
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
                                        color: theme.textSecondary
                                    }}>
                                        {shortAddressStr}
                                    </Text>
                                    <CopyIcon style={{ height: 12, width: 12, marginLeft: 12 }} height={12} width={12} color={theme.iconPrimary} />
                                </Pressable>
                            </>
                        )}
                        {!editing && !!parsed && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: 24,
                                    backgroundColor: theme.surfaceOnElevation,
                                    width: '100%',
                                    justifyContent: 'center', alignItems: 'center',
                                    borderRadius: 20,
                                    padding: 10
                                }}
                            >
                                <Pressable
                                    onPress={() => {
                                        navigation.navigate(
                                            'Assets',
                                            { target: parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }) }
                                        );
                                    }}
                                    style={({ pressed }) => ({
                                        opacity: pressed ? 0.5 : 1,
                                        borderRadius: 14,
                                        padding: 10,
                                        flexGrow: 1
                                    })}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View
                                            style={{
                                                backgroundColor: theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <Image source={require('@assets/ic_send.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}>
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </Pressable>
                                <Pressable
                                    onPress={onShare}
                                    style={({ pressed }) => {
                                        return { opacity: pressed ? 0.5 : 1, borderRadius: 14, padding: 10, flexGrow: 1 }
                                    }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View
                                            style={{
                                                backgroundColor: theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <ShareIcon height={24} width={24} color={'white'} style={{ height: 12, width: 12 }} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: theme.textPrimary,
                                            marginTop: 6,
                                            fontWeight: '500'
                                        }}>
                                            {t('common.share')}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        )}

                        {(!editing && fields.filter((f) => (f.value?.length ?? 0) > 0).length > 0) && (
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                paddingHorizontal: 20, marginTop: 20,
                                paddingVertical: 10,
                                width: '100%', borderRadius: 20
                            }}>
                                {
                                    fields.filter((f) => (f.value?.length ?? 0) > 0).map((field, index) => {
                                        return (
                                            <View key={`input-${index}`}>
                                                <ContactField
                                                    fieldKey={field.key}
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
                                                {index !== fields.filter((f) => (f.value?.length ?? 0) > 0).length - 1 && (
                                                    <ItemDivider marginHorizontal={0} />
                                                )}
                                            </View>
                                        )
                                    })
                                }
                            </View>
                        )}
                    </View>

                    {editing && (
                        <>
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                marginTop: 20,
                                paddingVertical: 20,
                                width: '100%', borderRadius: 20
                            }}>
                                <ATextInput
                                    ref={refs[params.isNew ? 1 : 0]}
                                    value={name}
                                    onValueChange={(newValue) => setName(newValue.trimStart())}
                                    label={t('contacts.name')}
                                    style={{ paddingHorizontal: 16 }}
                                    blurOnSubmit={true}
                                    editable={editing}
                                    onFocus={() => onFocus(params.isNew ? 1 : 0)}
                                />
                            </View>
                            {!params.isNew && (
                                <View style={{
                                    backgroundColor: theme.surfaceOnElevation,
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
                                        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                                            {t('common.walletAddress')}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 17, lineHeight: 24,
                                        fontWeight: '400',
                                        marginTop: 4,
                                        color: theme.textSecondary
                                    }}>
                                        {shortAddressStr}
                                    </Text>
                                </View>
                            )}
                            {params.isNew && (
                                <>
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
                                            label={t('common.walletAddress')}
                                            blurOnSubmit={true}
                                            editable={editing}
                                            multiline
                                            onFocus={() => onFocus(0)}
                                        />
                                    </View>
                                    {address.length >= 48 && !parsed && (
                                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                                            <Text style={{
                                                color: theme.accentRed,
                                                fontSize: 13,
                                                lineHeight: 18,
                                                marginTop: 8,
                                                marginLeft: 16,
                                                fontWeight: '400'
                                            }}>
                                                {t('transfer.error.invalidAddress')}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </>
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
                        </>
                    )}
                </Animated.View>
            </Animated.ScrollView>
            <View
                style={{
                    position: 'absolute', bottom: safeArea.bottom + 24, left: 0, right: 0,
                    paddingHorizontal: 16,
                    gap: 16
                }}
            >
                <RoundButton
                    display={'default'}
                    onPress={onAction}
                    title={editing ? t('contacts.save') : t('contacts.edit')}
                    disabled={editing ? !canSave : false}
                />
                <RoundButton
                    display={'danger_zone'}
                    onPress={onDelete}
                    title={t('contacts.delete')}
                />
            </View>
        </View>
    );
});