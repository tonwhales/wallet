import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { ContactItemView } from "../../components/Contacts/ContactItemView";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useSelectedAccount, useTheme, useAccountTransactions, useNetwork } from '../../engine/hooks';
import { ScreenHeader, useScreenHeader } from "../../components/ScreenHeader";
import { ContactTransactionView } from "../../components/Contacts/ContactTransactionView";
import { useParams } from "../../utils/useParams";
import { StatusBar } from "expo-status-bar";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { useDimensions } from "@react-native-community/hooks";
import { ATextInput } from "../../components/ATextInput";

const EmptyIllustrations = {
    dark: require('@assets/empty-contacts-dark.webp'),
    light: require('@assets/empty-contacts.webp')
}

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { callback } = useParams<{ callback?: (address: Address) => void }>();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const addressBook = useAddressBookContext().state;
    const contacts = addressBook.contacts;
    const account = useSelectedAccount();
    const dimensions = useDimensions();
    const transactions = useAccountTransactions(account?.addressString ?? '').data ?? [];

    const [search, setSearch] = useState('');

    const transactionsAddresses = useMemo(() => {
        const addresses = new Set<string>();
        // first 10 transactions
        transactions.slice(0, 10).forEach((t) => {
            if (t && !!t.base.operation.address) {
                addresses.add(t.base.operation.address);
            }
        });
        return Array.from(addresses).map((addr) => Address.parseFriendly(addr));
    }, [transactions]);

    const contactsEntries = Object.entries(contacts);
    const contactsSearchList = useMemo(() => {
        if (search && search.length > 0) {
            return contactsEntries.filter((d) => {
                const addr = d[0];
                const contact = d[1];
                const name = contact.name;
                const lastName = contact.fields?.find((f) => f.key === 'lastName')?.value;
                return (addr + name + (lastName ? ` ${lastName}` : '')).toLowerCase().includes(search.toLowerCase());
            });
        }
        return contactsEntries;
    }, [contactsEntries, search]);

    const onAddContact = useCallback(() => {
        navigation.navigate('ContactNew');
    }, []);

    if (Platform.OS === 'ios') {
        useScreenHeader(
            navigation,
            theme,
            {
                title: t('contacts.title'),
                headerShown: true,
                headerLargeTitle: false,
                tintColor: theme.accent,
                contentStyle: Platform.select({
                    ios: {
                        borderTopEndRadius: 0, borderTopStartRadius: 0,
                        paddingBottom: (safeArea.bottom === 0 ? 24 : safeArea.bottom) + 16,
                        backgroundColor: theme.elevation
                    },
                    android: { backgroundColor: theme.backgroundPrimary }
                }),
                onClosePressed: Platform.OS === 'ios' ? navigation.goBack : undefined,
                headerSearchBarOptions: Platform.select({
                    android: undefined,
                    ios: Object.entries(contacts).length > 0 ? {
                        hideWhenScrolling: false,
                        hideNavigationBar: false,
                        onChangeText: (event: any) => setSearch(event.nativeEvent.text),
                        placeholder: t('contacts.search'),
                        onCancelButtonPress: () => setSearch(''),
                    } : undefined,
                }),
                headerTintColor: theme.textPrimary
            }
        );
    }

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom + 16,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.OS === 'ios' ? (
                (Object.entries(contacts).length <= 0) && (
                    <ScreenHeader
                        title={t('contacts.title')}
                        onClosePressed={navigation.goBack}
                    />
                )
            ) : (
                <>
                    <ScreenHeader
                        title={t('contacts.title')}
                        onClosePressed={navigation.goBack}
                    />
                    <ATextInput
                        placeholder={t('contacts.search')}
                        onValueChange={setSearch}
                        value={search}
                        style={{
                            paddingHorizontal: 16, paddingVertical: 16,
                            backgroundColor: theme.surfaceOnBg,
                            margin: 16
                        }}
                    />
                </>
            )}
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: safeArea.bottom }}
                showsVerticalScrollIndicator={true}
            >
                {contactsEntries.length === 0 ? (
                    <>
                        <View style={{ alignItems: 'center' }}>
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                width: dimensions.screen.width - 32,
                                height: (dimensions.screen.width - 32) * 0.72,
                                borderRadius: 20, overflow: 'hidden',
                                marginTop: 20
                            }}>
                                <Image
                                    resizeMode={'center'}
                                    style={{ height: dimensions.screen.width - 32, width: dimensions.screen.width - 32, marginTop: -66 }}
                                    source={EmptyIllustrations[theme.style]}
                                />
                            </View>
                            <View style={{ alignItems: 'center', paddingHorizontal: 16, marginTop: 32 }}>
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
                        {transactionsAddresses.map((a, index) => {
                            return (
                                <ContactTransactionView
                                    key={`recent-${index}`}
                                    addr={a}
                                    testOnly={isTestnet}
                                />
                            );
                        })}
                    </>
                ) : (
                    <>
                        {contactsSearchList.map((d) => {
                            return (
                                <ContactItemView
                                    key={`contact-${d[0]}`}
                                    addressFriendly={d[0]}
                                    action={callback}
                                    testOnly={isTestnet}
                                />
                            );
                        })}
                        {contactsSearchList.length === 0 && (
                            <View style={{ alignItems: 'center', paddingHorizontal: 16, marginTop: 32 }}>
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
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
            {!callback && (
                <RoundButton
                    title={t('contacts.add')}
                    onPress={onAddContact}
                    style={[
                        { marginHorizontal: 16 },
                        Platform.select({ ios: { marginBottom: (contactsSearchList && contactsSearchList.length > 0) ? 16 + 56 + safeArea.bottom : 0 } })
                    ]}
                />
            )}
        </View>
    );
});