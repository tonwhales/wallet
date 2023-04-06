import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView, LayoutAnimation } from "react-native";
import Animated, { FadeInDown, FadeInLeft, FadeOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AddressDomainInput } from "../components/AddressDomainInput";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInputRef } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { formatDate, getDateKey } from "../utils/dates";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { TransactionView } from "./wallet/views/TransactionView";
import LottieView from 'lottie-react-native';

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const transactions = account?.transactions ?? [];
    const safeArea = useSafeAreaInsets();
    const settings = engine.products.settings;
    const contacts = settings.useContacts();

    const [addingAddress, setAddingAddress] = useState(false);
    const [domain, setDomain] = React.useState<string>();
    const [target, setTarget] = React.useState('');
    const [addressDomainInput, setAddressDomainInput] = React.useState('');
    const inputRef: React.RefObject<ATextInputRef> = React.createRef();
    const validAddress = useMemo(() => {
        try {
            const valid = target.trim();
            Address.parse(valid);
            return valid;
        } catch (error) {
            return null;
        }
    }, [target]);

    const onAddContact = useCallback(
        () => {
            if (validAddress) {
                setAddingAddress(false);
                navigation.navigate('Contact', { address: validAddress });
            }
        },
        [validAddress],
    );

    const contactsList = useMemo(() => {
        return Object.entries(contacts);
    }, [contacts]);

    const editContact = useMemo(() => {
        return !!contactsList.find(([key, value]) => {
            return key === target
        });
    }, [contactsList, target]);

    const transactionsComponents: any[] = React.useMemo(() => {
        let transactionsSectioned: { title: string, items: string[] }[] = [];
        if (transactions.length > 0) {
            let lastTime: string = getDateKey(transactions[0].time);
            let lastSection: string[] = [];
            let title = formatDate(transactions[0].time);
            transactionsSectioned.push({ title, items: lastSection });
            for (let t of transactions.length >= 3 ? transactions.slice(0, 3) : transactions) {
                let time = getDateKey(t.time);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(t.time);
                    transactionsSectioned.push({ title, items: lastSection });
                }
                lastSection.push(t.id);
            }
        }

        const views = [];
        for (let s of transactionsSectioned) {
            views.push(
                <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                    <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
                </View>
            );
            views.push(
                <View
                    key={'s-' + s.title}
                    style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: Theme.item, overflow: 'hidden' }}
                    collapsable={false}
                >
                    {s.items.map((t, i) => <TransactionView
                        own={engine.address}
                        engine={engine}
                        tx={t}
                        separator={i < s.items.length - 1}
                        key={'tx-' + t}
                        onPress={() => { }}
                    />)}
                </View >
            );
        }
        return views;
    }, [transactions]);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [addingAddress]);

    // 
    // Lottie animation
    // 
    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('contacts.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('contacts.title')}
                    </Text>
                </View>
            )}
            {(!contactsList || contactsList.length === 0) && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <View style={{ alignItems: 'center', paddingHorizontal: 16, }}>
                        <LottieView
                            ref={anim}
                            source={require('../../assets/animations/empty.json')}
                            autoPlay={true}
                            loop={true}
                            style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                        />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginHorizontal: 8,
                            marginBottom: 8,
                            textAlign: 'center',
                            color: Theme.textColor,
                        }}
                        >
                            {t('contacts.empty')}
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: Theme.priceSecondary
                        }}>
                            {t('contacts.description')}
                        </Text>
                    </View>
                    <View style={{ width: '100%' }}>
                        {transactionsComponents}
                    </View>
                </View>
            )}
            {(contactsList && contactsList.length > 0) && (
                <ScrollView style={{ flexGrow: 1 }}>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        flexShrink: 1,
                    }}>
                        {contactsList.map((d) => {
                            return (
                                <ContactItemView
                                    key={`contact-${d[0]}`}
                                    addr={d[0]}
                                    contact={d[1]}
                                />
                            );
                        })}
                    </View>
                </ScrollView>
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                    position: 'absolute', bottom: 0, left: 16, right: 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                {addingAddress && (
                    <>
                        {Platform.OS === 'android' && (
                            <Animated.View entering={FadeInDown}>
                                <View style={{
                                    marginBottom: 16, marginTop: 17,
                                    backgroundColor: Theme.item,
                                    borderRadius: 14,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <AddressDomainInput
                                        input={addressDomainInput}
                                        onInputChange={setAddressDomainInput}
                                        target={target}
                                        index={1}
                                        ref={inputRef}
                                        onTargetChange={setTarget}
                                        onDomainChange={setDomain}
                                        style={{
                                            backgroundColor: Theme.transparent,
                                            paddingHorizontal: 0,
                                            marginHorizontal: 16,
                                        }}
                                        onSubmit={onAddContact}
                                        labelText={t('contacts.contactAddress')}
                                    />
                                </View>
                            </Animated.View>
                        )}
                        {Platform.OS !== 'android' && (
                            <View style={{
                                marginBottom: 16, marginTop: 17,
                                backgroundColor: Theme.item,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <AddressDomainInput
                                    input={addressDomainInput}
                                    onInputChange={setAddressDomainInput}
                                    target={target}
                                    index={1}
                                    ref={inputRef}
                                    onTargetChange={setTarget}
                                    onDomainChange={setDomain}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        marginHorizontal: 16,
                                    }}
                                    onSubmit={onAddContact}
                                    labelText={t('contacts.contactAddress')}
                                />
                            </View>
                        )}
                    </>
                )}
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    {addingAddress && (
                        <>
                            {Platform.OS === 'android' && (
                                <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
                                    <RoundButton
                                        title={t('common.cancel')}
                                        disabled={!addingAddress}
                                        onPress={() => setAddingAddress(false)}
                                        display={'secondary'}
                                        style={{ flexGrow: 1, marginRight: 8 }}
                                    />
                                </Animated.View>
                            )}
                            {Platform.OS !== 'android' && (
                                <RoundButton
                                    title={t('common.cancel')}
                                    disabled={!addingAddress}
                                    onPress={() => setAddingAddress(false)}
                                    display={'secondary'}
                                    style={{ flexGrow: 1, marginRight: 8 }}
                                />
                            )}
                        </>
                    )}
                    <RoundButton
                        title={addingAddress && editContact ? t('contacts.edit') : t('contacts.add')}
                        style={{ flexGrow: 1 }}
                        disabled={addingAddress && !validAddress}
                        onPress={() => {
                            if (addingAddress) {
                                onAddContact();
                                return;
                            }
                            setAddingAddress(true);
                        }}
                        display={'default'}
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