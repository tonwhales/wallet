import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { RoundButton } from "../components/RoundButton";
import { useEngine } from "../engine/Engine";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { Theme } from "../Theme";
import { warn } from "../utils/log";
import { useParams } from "../utils/useParams";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const ContactFragment = fragment(() => {
    const params = useParams<{ address: string }>();
    const navigation = useTypedNavigation();

    try {
        Address.parse(params.address);
    } catch (e) {
        warn(e);
        navigation.goBack();
    }
    const address = useMemo(() => Address.parse(params.address), []);
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const settings = engine.products.settings;
    const contact = settings.useContact(Address.parse(params.address));

    const [name, setName] = useState(contact?.name);
    const [notes, setNotes] = useState((contact?.extras || {})['notes'] || '');

    const disabled = useMemo(() => {
        return !(name !== contact?.name || notes !== (contact?.extras || {})['notes'])
    }, [contact, name, notes]);

    const onSave = useCallback(
        () => {
            if (!name || name.length > 126) {
                Alert.alert(t('contacts.alert.name'), t('contacts.alert.nameDescription'))
                return;
            }
            if (!!notes && notes.length > 280) {
                Alert.alert(t('contacts.alert.notes'), t('contacts.alert.notesDescription'))
                return;
            }
            settings.setContact(address, { name, extras: { notes } })
        },
        [notes, name, address],
    );


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
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginVertical: 8,
                            color: Theme.textColor
                        }}>
                            {`${t('common.walletAddress')}: ${params.address.slice(0, 6) + '...' + params.address.slice(params.address.length - 6)}`}
                        </Text>
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 4,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ATextInput
                            value={name}
                            onValueChange={setName}
                            placeholder={t('contacts.name')}
                            keyboardType="ascii-capable"
                            preventDefaultHeight
                            multiline
                            autoCorrect={false}
                            autoComplete={'off'}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                    </View>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginVertical: 8,
                            color: Theme.textColor
                        }}>
                            {t('contacts.notes')}
                        </Text>
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 4,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ATextInput
                            value={notes}
                            onValueChange={setNotes}
                            placeholder={t('contacts.notes')}
                            keyboardType="ascii-capable"
                            preventDefaultHeight
                            multiline
                            autoCorrect={false}
                            autoComplete={'off'}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton
                    title={t(!!contact ? 'contacts.edit' : 'contacts.add')}
                    onPress={onSave}
                    disabled={disabled}
                    display={disabled ? 'secondary' : 'default'}
                />
            </View>
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