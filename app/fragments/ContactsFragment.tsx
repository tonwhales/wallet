import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useAppConfig } from "../utils/AppConfigContext";
import { useScreenHeader } from "../components/ScreenHeader";
import { ContactTransactionView } from "../components/Contacts/ContactTransactionView";
import { useDimensions } from "@react-native-community/hooks";
import { Address } from "ton";

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const main = engine.products.main;
    const safeArea = useSafeAreaInsets();
    const settings = engine.products.settings;
    const contacts = settings.useContacts();
    const account = engine.products.main.useAccount();
    const transactions = (account?.transactions.slice(0, Math.min(account.transactions.length - 1, 10))) ?? [];
    // Unique by address transactions
    const transactionsAddresses = useMemo(() => {
        const addresses = new Set<string>();
        transactions.forEach((t) => {
            const tx = main.getTransaction(t.id);
            if (tx && !!tx?.address) {
                addresses.add(tx.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
        });
        return Array.from(addresses).map((addr) => Address.parse(addr));
    }, [transactions]);
    const dimentions = useDimensions();

    const [searchFocused, setSearchFocused] = useState(false);
    const [search, setSearch] = useState('');

    const onAddContact = useCallback(() => {
        navigation.navigate('Contact', { isNew: true });
    }, []);

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

    useScreenHeader(
        navigation,
        Theme,
        {
            title: t('contacts.title'),
            headerShown: true,
            headerLargeTitle: true,
            tintColor: Theme.accent,
            rightButton: (
                !searchFocused ? (
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
                        }}>
                            {t('common.add')}
                        </Text>
                    </Pressable>
                )
                    : undefined
            ),
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
        }}>
            <StatusBar style={'dark'} />
            {(!contactsList || contactsList.length === 0) && (
                <ScrollView
                    style={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: safeArea.bottom }}
                    showsVerticalScrollIndicator={true}
                    contentInset={{ top: 0, bottom: safeArea.bottom + 44 + 64 + 16 }}
                >
                    <Image
                        resizeMode={'contain'}
                        style={{
                            width: dimentions.screen.width - 32,
                            height: undefined,
                            aspectRatio: 1,
                        }}
                        source={require('../../assets/banner_contacts.webp')}
                    />
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

                    <View style={{ marginTop: 16 }}>
                        {transactionsAddresses.map((a, index) => {
                            return (<ContactTransactionView key={`recent-${index}`} address={a} />);
                        })}
                    </View>
                </ScrollView>
            )}
            {(contactsList && contactsList.length > 0) && (
                <ScrollView
                    style={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: safeArea.bottom }}
                    showsVerticalScrollIndicator={true}
                    contentInset={{ top: 0, bottom: safeArea.bottom + 44 + 64 + 16 }}
                >
                    {contactsList.map((d) => {
                        return (
                            <ContactItemView
                                key={`contact-${d[0]}`}
                                addr={d[0]}
                                contact={d[1]}
                            />
                        );
                    })}
                </ScrollView>
            )}
        </View>
    )
});