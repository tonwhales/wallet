import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { Theme } from "../../Theme";

export const WalletCreatedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const [loose, setLoose] = useState(false);
    const [share, setShare] = useState(false);
    const [responsibility, setResponsibility] = useState(false);

    return (
        <View style={{
            flexGrow: 1,
            flexDirection: 'column',
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: 'white',
            paddingHorizontal: 16,
        }}>
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                style={{ paddingHorizontal: 0, marginTop: height > 800 ? height * 0.13 : 50 }}
                animation={require('../../../assets/animations/folders.json')}
                title={t('Back up your wallet')}
                text={t('In the next step you will see 24 secret words that allows you to recover a wallet')}
            >
                <View
                    style={{
                        marginBottom: 32,
                        marginHorizontal: 16,
                        marginTop: 20,
                        marginVertical: 16,
                        borderRadius: 14,
                        backgroundColor: '#F2F2F6',
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
                            color={loose ? Theme.accent : '#B6B6BF'}
                            style={{
                                marginRight: 11,
                                marginLeft: 1
                            }}
                        />
                        <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                            {t('If I lose recovery phrase, my funds will be lost forever.')}
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
                            color={share ? Theme.accent : '#B6B6BF'}
                            style={{
                                marginRight: 11,
                                marginLeft: 1
                            }}
                        />
                        <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                            {t('If I expose or share my recovery phrase to anybody, my funds can be stolen.')}
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
                            color={responsibility ? Theme.accent : '#B6B6BF'}
                            style={{
                                marginRight: 11,
                                marginLeft: 1
                            }}
                        />
                        <Text style={{ fontSize: 14, fontWeight: '400', flexShrink: 1 }}>
                            {t('It is my full responsibility to keep my recovery phrase secure.')}
                        </Text>
                    </Pressable>
                </View>
            </FragmentMediaContent>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, position: 'absolute', bottom: safeArea.bottom, left: 16, right: 16 }}>
                <RoundButton
                    display={(loose && share && responsibility) ? 'default' : 'secondary'}
                    disabled={!(loose && share && responsibility)}
                    title={t("Back up now")}
                    onPress={() => navigation.navigate('WalletBackupInit')}
                />
            </View>
        </View>
    );
});