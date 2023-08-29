import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useTheme } from '../../engine/hooks/useTheme';

export const WalletCreatedFragment = systemFragment(() => {
    const theme = useTheme();
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
            backgroundColor: theme.item,
            paddingHorizontal: 16,
        }}>
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                style={{ paddingHorizontal: 0 }}
                animation={require('../../../assets/animations/folders.json')}
                title={t('backupIntro.title')}
                text={t('backupIntro.subtitle')}
            >
                <View
                    style={{
                        marginBottom: 32,
                        marginHorizontal: 16,
                        marginTop: 20,
                        marginVertical: 16,
                        borderRadius: 14,
                        backgroundColor: theme.background,
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
                            color={loose ? theme.accent : theme.unchecked}
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
                            color={share ? theme.accent : theme.unchecked}
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
                            color={responsibility ? theme.accent : theme.unchecked}
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
            </FragmentMediaContent>
            <View style={{ flexGrow: 1 }} />
            <View style={{
                height: 64,
                position: 'absolute',
                bottom: safeArea.bottom + (Platform.OS === 'ios' ? (safeArea.bottom ?? 16) + 16 : 0),
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