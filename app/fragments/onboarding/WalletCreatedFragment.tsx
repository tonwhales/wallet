import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useAppConfig } from "../../utils/AppConfigContext";

export const WalletCreatedFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [loose, setLoose] = useState(false);
    const [share, setShare] = useState(false);
    const [responsibility, setResponsibility] = useState(false);

    return (
        <View style={{
            flexGrow: 1,
            flexDirection: 'column',
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: Theme.surfacePimary,
            paddingHorizontal: 16,
        }}>
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                style={{ paddingHorizontal: 0 }}
                animation={require('@assets/animations/folders.json')}
                title={t('backupIntro.title')}
                text={t('backupIntro.subtitle')}
            >
                <ScrollView style={{ width: '100%', flexGrow: 0, paddingHorizontal: 16, flexShrink: 1 }}>
                    <View
                        style={{
                            marginBottom: 32,
                            marginTop: 20,
                            borderRadius: 14,
                            marginVertical: 16,
                            backgroundColor: Theme.background,
                            paddingHorizontal: 16,
                            paddingVertical: 15
                        }}
                    >
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    flexDirection: 'row',
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => setLoose(!loose)}
                        >
                            <Ionicons
                                name={loose ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={loose ? Theme.accent : Theme.divider}
                                style={{
                                    marginRight: 11,
                                    marginLeft: 1
                                }}
                            />
                            <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                                {t('backupIntro.clause1')}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    flexDirection: 'row',
                                    width: '100%', marginTop: 14, marginBottom: 14,
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => setShare(!share)}
                        >
                            <Ionicons
                                name={share ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={share ? Theme.accent : Theme.divider}
                                style={{
                                    marginRight: 11,
                                    marginLeft: 1
                                }}
                            />
                            <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                                {t('backupIntro.clause2')}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    flexDirection: 'row',
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => { setResponsibility(!responsibility) }}
                        >
                            <Ionicons
                                name={responsibility ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={responsibility ? Theme.accent : Theme.divider}
                                style={{
                                    marginRight: 11,
                                    marginLeft: 1
                                }}
                            />
                            <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                                {t('backupIntro.clause3')}
                            </Text>
                        </Pressable>
                    </View>
                    <View style={{ height: 64 }} />
                </ScrollView>
            </FragmentMediaContent>
            <View style={{ flexGrow: 1 }} />
            <View style={{
                height: 64,
                position: 'absolute',
                bottom: safeArea.bottom + (Platform.OS === 'ios' ? (safeArea.bottom === 0? 32 : safeArea.bottom) + 16 : 0),
                left: 16, right: 16
            }}>
                <RoundButton
                    display={(loose && share && responsibility) ? 'default' : 'secondary'}
                    disabled={!(loose && share && responsibility)}
                    title={t('common.accept')}
                    onPress={() => navigation.navigate('WalletBackupInit')}
                />
            </View>
        </View>
    );
});