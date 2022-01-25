import { Text, View } from "react-native";
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

    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', backgroundColor: 'white' }}>
            <View style={{ flexGrow: 1 }} />
            <LottieView
                source={require('../../../assets/animations/folders.json')}
                autoPlay={true}
                loop={true}
                style={{ width: 128, height: 128, marginBottom: 8 }}
            />
            <Text style={{ marginHorizontal: 24, fontSize: 30, fontWeight: '700' }}>
                {t('Back up your wallet')}
            </Text>
            <Text style={{
                marginHorizontal: 32, marginTop: 11, fontSize: 16,
                fontWeight: '400',
                textAlign: 'center'
            }}>
                {t('You will be shown a secret recovery phrase on the next screen. The recovery phrase is the only key to your wallet. It will allow you to recover access to your wallet if your phone is lost or stolen.')}
            </Text>
            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 32,
                    marginTop: 20,
                    borderRadius: 14,
                    backgroundColor: '#F2F2F6',
                    paddingVertical: 15,
                    paddingHorizontal: 16,
                }}
            >
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
                    <Text style={{ fontSize: 16, fontWeight: '400' }}>
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
                    <Text style={{ fontSize: 16, fontWeight: '400' }}>
                        {t('If I expose or share my recovery phrase to anybody, my funds can be stolen.')}
                    </Text>
                </View>
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
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
                    <Text style={{ fontSize: 16, fontWeight: '400' }}>
                        {t('It is my full responsibility to keep my recovery phrase secure.')}
                    </Text>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />

            <View style={{ height: 64, marginHorizontal: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Back up now")} onPress={() => navigation.navigate('WalletBackupInit')} />
            </View>
        </View>
    );
});