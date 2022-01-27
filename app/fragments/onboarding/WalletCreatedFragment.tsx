import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useTranslation } from "react-i18next";
import React from "react";
import { Ionicons } from '@expo/vector-icons';

export const WalletCreatedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const { height } = useWindowDimensions();

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: 'white',
            paddingHorizontal: 16,
        }}>
            <View style={{ flexGrow: 1 }} />
            <LottieView
                source={require('../../../assets/animations/folders.json')}
                autoPlay={true}
                loop={true}
                style={{ width: height * 0.15, height: height * 0.15, marginBottom: 8 }}
            />
            <Text style={{ marginHorizontal: 8, fontSize: 30, fontWeight: '700' }}>
                {t('Back up your wallet')}
            </Text>
            <Text style={{
                marginTop: 11, fontSize: 16,
                fontWeight: '400',
                textAlign: 'center'
            }}>
                {t('You will be shown a secret recovery phrase on the next screen. The recovery phrase is the only key to your wallet. It will allow you to recover access to your wallet if your phone is lost or stolen.')}
            </Text>
            <View
                style={{
                    width: '100%',
                    marginBottom: 32,
                    marginHorizontal: 20,
                    marginTop: 20,
                    marginVertical: 16,
                    borderRadius: 14,
                    backgroundColor: '#F2F2F6',
                    paddingHorizontal: 16,
                }}
            >
                <View style={{
                    flexDirection: 'row',
                    marginBottom: 14,
                    marginTop: 15
                }}>
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="black"
                        style={{
                            marginRight: 11,
                            marginLeft: 1
                        }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '400', flexShrink: 1 }}>
                        {t('If I lose recovery phrase, my funds will be lost forever.')}
                    </Text>
                </View>
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
                    marginBottom: 14
                }}>

                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="black"
                        style={{
                            marginRight: 11,
                            marginLeft: 1
                        }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '400', flexShrink: 1 }}>
                        {t('If I expose or share my recovery phrase to anybody, my funds can be stolen.')}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="black"
                        style={{
                            marginRight: 11,
                            marginLeft: 1
                        }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '400', flexShrink: 1 }}>
                        {t('It is my full responsibility to keep my recovery phrase secure.')}
                    </Text>
                </View>
            </View>
            <View style={{ flexGrow: 1, marginBottom: 32 }} />
            <View style={{ height: 64, position: 'absolute', bottom: safeArea.bottom, left: 16, right: 16 }}>
                <RoundButton title={t("Back up now")} onPress={() => navigation.navigate('WalletBackupInit')} />
            </View>
        </View>
    );
});