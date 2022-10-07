import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const settings = engine.products.settings;
    const contacts = settings.useContacts();

    const list = useMemo(() => {
        return Object.entries(contacts);
    }, [contacts]);

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
                            <ContactItemView
                                key={`contact-${d[0]}`}
                                addr={d[0]}
                                contact={d[1]}
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