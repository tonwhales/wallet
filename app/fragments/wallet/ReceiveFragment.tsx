import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import Clipboard from '@react-native-clipboard/clipboard';
import { View, Platform, Share, Text, Image } from "react-native";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { Theme } from "../../Theme";
import { useNavigation } from "@react-navigation/native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { AppConfig } from "../../AppConfig";
import { WalletAddress } from "../../components/WalletAddress";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
import { QRCode } from "../../components/QRCode/QRCode";
import { Suspense } from "../../Suspense";

export const ReceiveFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const link = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/') + address.toFriendly({ testOnly: AppConfig.isTestnet });

    const onCopy = React.useCallback(() => {
        Clipboard.setString(link);
    }, []);

    const onShare = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: link });
        } else {
            Share.share({ title: t('receive.share.title'), message: link });
        }
    }, []);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top }} pageTitle={t('receive.title')} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {t('receive.title')}
                    </Text>
                )}
                <Text style={{ fontSize: 16, color: Theme.textSecondary, marginTop: Platform.OS === 'android' ? 7 + 56 : 7, paddingHorizontal: 32, textAlign: 'center' }}>
                    {t('receive.subtitle')}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: 'white', borderRadius: 36,
                paddingHorizontal: 16, paddingTop: 50, paddingBottom: 25,
                marginHorizontal: 45,
                width: 300, height: 344
            }}>
                <View style={{ flex: 1 }}>
                    <Suspense>
                        <QRCode data={link} size={202} />
                    </Suspense>
                    <View style={{ position: 'absolute', bottom: 0, left: 0, top: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ padding: 2, backgroundColor: 'white', borderRadius: 8 }}>
                            <Image source={require('../../../assets/ic_qr_logo.png')} style={{ height: 30, width: 30 }} />
                        </View>
                    </View>
                </View>
                <WalletAddress
                    address={address}
                    style={{ marginTop: 16 }}
                />
                <Text style={{ fontSize: 16, color: Theme.textSecondary, fontWeight: '400', textAlign: 'center', marginTop: 6 }}>
                    {t('common.walletAddress')}
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
                    title={t('common.copy')}
                    onPress={onCopy}
                    style={{ flex: 2, marginRight: 16, alignSelf: 'stretch' }}
                    display={'secondary'}
                />
                <RoundButton
                    title={t('common.share')}
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