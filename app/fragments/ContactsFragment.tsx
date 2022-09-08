import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { avatarImages } from "../components/Avatar";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { AddressContact } from "../engine/products/SettingsProduct";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { avatarHash } from "../utils/avatarHash";
import { confirmAlert } from "../utils/confirmAlert";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ProductButton } from "./wallet/products/ProductButton";

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const settings = engine.products.settings;
    const contacts = settings.useContacts();

    const list = useMemo(() => {
        return Object.entries(contacts);
    }, [contacts]);

    const onContact = useCallback((addr: string, contact: AddressContact) => {
        Alert.alert(contact.name, undefined, [
            {
                text: t('contacts.delete'), style: 'destructive', onPress: async () => {
                    const confirmed = await confirmAlert('contacts.delete');
                    if (confirmed) {
                        try {
                            let parsed = Address.parse(addr);
                            settings.removeContact(parsed);
                        } catch (e) {
                            console.warn(e);
                            Alert.alert(t('transfer.error.invalidAddress'));
                            return;
                        }
                    }
                }
            },
            {
                text: t('contacts.edit'), onPress: () => {
                    navigation.navigate('Contact', { address: addr })
                }
            },
            { text: t('common.cancel') }
        ]);
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
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('contacts.title')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    flexShrink: 1,
                }}>
                    {(!list || list.length === 0) && (
                        <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                marginHorizontal: 16,
                                marginVertical: 8,
                                color: Theme.textSecondary
                            }}>
                                {t('contacts.empty')}
                            </Text>
                        </View>
                    )}
                    {list.map((d) => {
                        return (
                            <ProductButton
                                key={`contact-${d[0]}`}
                                name={d[1].name}
                                subtitle={(d[1].extras || {})['notes'] || ''}
                                value={null}
                                icon={avatarImages[avatarHash(d[0], avatarImages.length)]}
                                onPress={() => onContact(d[0], d[1])}
                                style={{ marginVertical: 4, marginHorizontal: 0 }}
                            />
                        );
                    })}
                </View>
            </ScrollView>
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