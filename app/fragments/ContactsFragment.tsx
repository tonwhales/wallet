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

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const safeArea = useSafeAreaInsets();
    const settings = engine.products.settings;
    const contacts = settings.useContacts();

    const [search, setSearch] = useState('');

    const onAddContact = useCallback(
        () => {
            navigation.navigate('Contact', { new: true });
        },
        [],
    );

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
            ),
            onBackPressed: navigation.goBack,
            headerSearchBarOptions: {
                hideWhenScrolling: false,
                onChangeText: (event) => setSearch(event.nativeEvent.text),
                placeholder: t('contacts.search'),
                onCancelButtonPress: () => setSearch(''),
            },
        }
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

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