import { Address } from "@ton/core";
import { RefObject, createRef, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, Platform, View, Text, KeyboardAvoidingView } from "react-native";
import { useBounceableWalletFormat, useContact, useRemoveContact, useSetContact } from "../../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContractInfo } from "../../engine/hooks/metadata/useContractInfo";
import { requiredFields } from "../../fragments/contacts/ContactNewFragment";
import { t } from "../../i18n/t";
import { confirmAlert } from "../../utils/confirmAlert";
import Animated, { measure, useAnimatedRef, scrollTo, runOnUI, useSharedValue } from "react-native-reanimated";
import { useKeyboard } from "@react-native-community/hooks";
import { ThemeType } from "../../engine/state/theme";
import { ATextInput, ATextInputRef } from "../ATextInput";
import { ContactField } from "./ContactField";
import { ItemDivider } from "../ItemDivider";
import { RoundButton } from "../RoundButton";
import { Avatar } from "../avatar/Avatar";
import { KnownWallet } from "../../secure/KnownWallets";

export const ContactEdit = memo(({
    address,
    onDeleted,
    onSaved,
    isTestnet,
    theme,
    knownWallets
}: {
    onSaved: () => void,
    onDeleted: () => void,
    address: string,
    isTestnet: boolean,
    theme: ThemeType,
    knownWallets: { [key: string]: KnownWallet }
}) => {
    const parsed = useMemo(() => {
        try {
            return Address.parseFriendly(address);
        } catch {
            return null;
        }
    }, [address]);

    const setContact = useSetContact();
    const removeContact = useRemoveContact();
    const safeArea = useSafeAreaInsets();
    const contact = useContact(address);
    const contractInfo = useContractInfo(address);

    const [bounceableFormat] = useBounceableWalletFormat();
    const [name, setName] = useState(contact?.name);
    const [fields, setFields] = useState(contact?.fields || requiredFields);

    const shortAddressStr = useMemo(() => {
        if (!parsed) {
            return null;
        }
        const bounceable = (contractInfo?.kind === 'wallet')
            ? bounceableFormat
            : true;
        const friendly = parsed.address.toString({ testOnly: isTestnet, bounceable });
        return `${friendly.slice(0, 6) + '...' + friendly.slice(friendly.length - 6)}`;
    }, [contractInfo, bounceableFormat, parsed, isTestnet]);

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
            parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }),
            { name, fields }
        );
        onSaved();
    }, [fields, name, parsed, isTestnet, setContact, onSaved]);

    const onDelete = useCallback(async () => {
        if (!parsed) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }
        const confirmed = await confirmAlert('contacts.delete');
        if (confirmed) {
            await removeContact(parsed.address.toString({ testOnly: isTestnet, bounceable: parsed.isBounceable }));
            onDeleted();
        }
    }, [parsed, isTestnet, removeContact, onDeleted]);

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

    const ready = !(!parsed || !name || name?.length === 0);

    const hasChanges = useMemo(() => {
        if (name !== contact?.name) {
            return true;
        }
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].value !== (contact?.fields || [])[i]?.value) {
                return true;
            }
        }
        return false;
    }, [fields, name, contact]);

    const canSave = hasChanges && ready;

    return (
        <View style={{ flexGrow: 1 }}>
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
                                hashColor
                                knownWallets={knownWallets}
                            />
                        </View>
                    </View>
                    <>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginTop: 20,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20
                        }}>
                            <ATextInput
                                ref={refs[0]}
                                value={name}
                                onValueChange={(newValue) => setName(newValue.trimStart())}
                                label={t('contacts.name')}
                                style={{ paddingHorizontal: 16 }}
                                blurOnSubmit={true}
                                editable={true}
                                onFocus={() => onFocus(0)}
                                cursorColor={theme.accent}
                            />
                        </View>
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
                                                ref={refs[index + 1]}
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
                    </>
                </Animated.View>
            </Animated.ScrollView>
            {Platform.OS === 'ios' ? (
                <View
                    style={{
                        position: 'absolute', bottom: safeArea.bottom + 24, left: 0, right: 0,
                        paddingHorizontal: 16,
                        gap: 16
                    }}
                >
                    <RoundButton
                        display={'default'}
                        action={onAction}
                        title={t('contacts.save')}
                        disabled={!canSave}
                    />
                    <RoundButton
                        display={'danger_zone'}
                        action={onDelete}
                        title={t('contacts.delete')}
                    />
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={{
                        gap: 16,
                        paddingHorizontal: 16,
                        marginVertical: 16,
                    }}
                >
                    <RoundButton
                        display={'default'}
                        action={onAction}
                        title={t('contacts.save')}
                        disabled={!canSave}
                    />
                    <RoundButton
                        display={'danger_zone'}
                        action={onDelete}
                        title={t('contacts.delete')}
                    />
                </KeyboardAvoidingView>
            )}

        </View>
    );
});