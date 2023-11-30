import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useClient4, useNetwork, useSelectedAccount, useTheme, useAccountTransactions } from '../engine/hooks';
import { useContacts } from "../engine/hooks/contacts/useContacts";
import { ScreenHeader, useScreenHeader } from "../components/ScreenHeader";
import { ContactTransactionView } from "../components/Contacts/ContactTransactionView";
import { useParams } from "../utils/useParams";
import { StatusBar } from "expo-status-bar";

import IcSpamNonen from '@assets/ic-spam-none.svg';
import { useAddressBookContext } from "../engine/AddressBookContext";


export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const { callback } = useParams<{ callback?: (address: Address) => void }>();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const addressBook = useAddressBookContext().state;
    const contacts = addressBook.contacts;
    const account = useSelectedAccount();
    const client = useClient4(isTestnet);
    const transactions = useAccountTransactions(client, account?.addressString ?? '').data ?? [];

    const [search, setSearch] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const transactionsAddresses = useMemo(() => {
        const addresses = new Set<string>();
        // first 10 transactions
        transactions.slice(0, 10).forEach((t) => {
            if (t && !!t.base.operation.address) {
                addresses.add(t.base.operation.address);
            }
        });
        return Array.from(addresses).map((addr) => Address.parse(addr));
    }, [transactions]);

    const contactsList = useMemo(() => {
        if (search && search.length > 0) {
            return Object.entries(contacts).filter((d) => {
                const addr = d[0];
                const contact = d[1];
                const name = contact.name;
                const lastName = contact.fields?.find((f) => f.key === 'lastName')?.value;
                return (addr + name + (lastName ? ` ${lastName}` : '')).toLowerCase().includes(search.toLowerCase());
            });
        }
        return Object.entries(contacts);
    }, [contacts, search]);


    const onAddContact = useCallback(() => {
        navigation.navigate('Contact', { isNew: true });
    }, []);

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

    useScreenHeader(
        navigation,
        theme,
        {
            title: t('contacts.title'),
            headerShown: true,
            headerLargeTitle: true,
            tintColor: theme.accent,
            onClosePressed: Platform.OS === 'ios' ? navigation.goBack : undefined,
            headerSearchBarOptions: Object.entries(contacts).length > 0 ? {
                hideWhenScrolling: false,
                hideNavigationBar: false,
                onFocus: () => setSearchFocused(true),
                onBlur: () => setSearchFocused(false),
                onChangeText: (event) => setSearch(event.nativeEvent.text),
                placeholder: t('contacts.search'),
                onCancelButtonPress: () => setSearch('')
            } : undefined,
        }
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom + 16,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {(Object.entries(contacts).length <= 0) && (
                <ScreenHeader
                    title={t('contacts.title')}
                    onClosePressed={navigation.goBack}
                />
            )}
            {(!contactsList || contactsList.length === 0) ? (
                <>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ alignItems: 'center' }}>
                        <IcSpamNonen
                            height={68}
                            width={68}
                            style={{
                                height: 68,
                                width: 68,
                            }}
                        />
                        <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 32 }}>
                            <Text style={{
                                fontSize: 32, lineHeight: 38,
                                fontWeight: '600',
                                marginBottom: 16,
                                textAlign: 'center',
                                color: theme.textPrimary,
                            }}
                            >
                                {t('contacts.empty')}
                            </Text>
                            <Text style={{
                                fontSize: 17, lineHeight: 24,
                                fontWeight: '400',
                                color: theme.textSecondary,
                                textAlign: 'center'
                            }}>
                                {t('contacts.description')}
                            </Text>
                        </View>

                    </View>
                    <ScrollView
                        style={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: safeArea.bottom, marginTop: 16 }}
                        showsVerticalScrollIndicator={true}
                    >
                        {transactionsAddresses.map((a, index) => {
                            return (<ContactTransactionView key={`recent-${index}`} address={a} />);
                        })}
                    </ScrollView>
                </>
            ) : (
                <ScrollView
                    style={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: safeArea.bottom }}
                    showsVerticalScrollIndicator={true}
                >
                    {contactsList.map((d) => {
                        return (
                            <ContactItemView
                                key={`contact-${d[0]}`}
                                addr={d[0]}
                                action={callback}
                            />
                        );
                    })}
                </ScrollView>

            )}
            {!callback && (
                <RoundButton
                    title={t('contacts.add')}
                    onPress={onAddContact}
                    style={[
                        { marginHorizontal: 16 },
                        Platform.select({ ios: { marginBottom: (contactsList && contactsList.length > 0) ? 16 + 56 + safeArea.bottom : 0 } })
                    ]}
                />
            )}
        </View>
    )
});