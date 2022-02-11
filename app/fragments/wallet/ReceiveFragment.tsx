import React from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import Clipboard from '@react-native-clipboard/clipboard';
import { View, Platform, Share, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { Theme } from "../../Theme";
import { useNavigation } from "@react-navigation/native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { AppConfig } from "../../AppConfig";
import { WalletAddress } from "../../components/WalletAddress";

export const ReceiveFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const link = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/') + address.toFriendly({ testOnly: AppConfig.isTestnet });

    const onCopy = React.useCallback(() => {
        Clipboard.setString(link);
    }, []);

    const onShare = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('My Tonhub Address'), url: link });
        } else {
            Share.share({ title: t('My Tonhub Address'), message: link });
        }
    }, []);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined
        }}>
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top }} pageTitle={t("Receive Ton")} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {t("Receive Ton")}
                    </Text>
                )}
                <Text style={{ fontSize: 16, color: Theme.textSecondary, marginTop: Platform.OS === 'android' ? 7 + 56 : 7, paddingHorizontal: 32, textAlign: 'center' }}>
                    {t("Share this link to receive Ton")}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: 'white', borderRadius: 36,
                paddingHorizontal: 50, paddingTop: 50, paddingBottom: 25,
                marginHorizontal: 45,
                width: 300, height: 344
            }}>
                <QRCode
                    size={202}
                    ecl="L"
                    value={link}
                    color={'#303757'}
                    logo={require('../../../assets/ic_qr_logo.png')}
                    logoMargin={4}
                    logoSize={40}
                    logoBackgroundColor='transparent'
                />
                <WalletAddress address={address.toFriendly({ testOnly: AppConfig.isTestnet })} />
                <Text style={{ fontSize: 16, color: Theme.textSecondary, fontWeight: '400', textAlign: 'center', marginTop: 6 }}>
                    {t("Wallet address")}
                </Text>
            </View>
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 16, marginBottom: safeArea.bottom + 16,
                justifyContent: 'space-evenly',
                // position: 'absolute', bottom: 0,
                alignContent: 'stretch'
            }}>
                <RoundButton
                    title={t("Copy")}
                    onPress={onCopy}
                    style={{ flex: 2, marginRight: 16, alignSelf: 'stretch' }}
                    display={'secondary'}
                />
                <RoundButton
                    title={t("Share")}
                    onPress={onShare}
                    style={{ flex: 2, alignSelf: 'stretch' }}
                />
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});