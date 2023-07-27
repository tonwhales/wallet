import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView, LayoutAnimation, Image, Pressable } from "react-native";
import Animated, { FadeInDown, FadeInLeft, FadeOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AddressDomainInput } from "../components/AddressDomainInput";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInputRef } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { formatDate, getDateKey } from "../utils/dates";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { TransactionView } from "./wallet/views/TransactionView";
import LottieView from 'lottie-react-native';
import { useAppConfig } from "../utils/AppConfigContext";
import { ScreenHeader } from "../components/ScreenHeader";

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();
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
            navigation.navigate('Contact', { new: true });
        },
        [],
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
            <ScreenHeader
                title={t('contacts.title')}
                onBackPressed={navigation.goBack}
                rightButton={(
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                            }
                        }}
                        onPress={onAddContact}
                        hitSlop={
                            Platform.select({
                                ios: undefined,
                                default: { top: 16, right: 16, bottom: 16, left: 16 },
                            })
                        }
                    >
                        <Text style={{
                            color: Theme.accent,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
                            marginRight: 16,
                        }}>
                            {t('common.add')}
                        </Text>
                    </Pressable>
                )}
            />

            {(!contactsList || contactsList.length === 0) && (
                <View style={{
                    flexGrow: 1,
                    alignItems: 'center',
                }}>
                    <Image style={{ marginTop: 80, flexShrink: 1 }} source={require('../../assets/banner_contacts.png')} />
                    <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 32 }}>
                        <Text style={{
                            fontSize: 32, lineHeight: 38,
                            fontWeight: '600',
                            marginBottom: 16,
                            textAlign: 'center',
                            color: Theme.textColor,
                        }}
                        >
                            {t('contacts.empty')}
                        </Text>
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            color: Theme.darkGrey,
                            textAlign: 'center'
                        }}>
                            {t('contacts.description')}
                        </Text>
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
        </View>
    )
});