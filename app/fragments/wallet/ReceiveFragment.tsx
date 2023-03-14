import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { View, Platform, Text } from "react-native";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { useNavigation } from "@react-navigation/native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { Address } from "ton";
import TonIcon from '../../../assets/ic_ton_account.svg';
import { CopyButton } from "../../components/CopyButton";
import { ShareButton } from "../../components/ShareButton";

export const ReceiveFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useNavigation();
    const params = useParams<{ addr?: string }>();
    const address = React.useMemo(() => {
        if (params.addr) {
            return Address.parse(params.addr);
        }
        return getCurrentAddress().address;
    }, [params]);
    const friendly = address.toFriendly({ testOnly: AppConfig.isTestnet });
    const link = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/') + address.toFriendly({ testOnly: AppConfig.isTestnet });

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top }} pageTitle={t('receive.title')} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 17 }}>
                        {t('receive.title')}
                    </Text>
                )}
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ padding: 16, width: '100%' }}>
                <View style={{
                    justifyContent: 'center',
                    backgroundColor: 'white', borderRadius: 20,
                    marginHorizontal: 16, padding: 14,
                    minHeight: 358
                }}>
                    <View style={{ marginBottom: 40, flexDirection: 'row' }}>
                        <TonIcon width={42} height={42} style={{ marginRight: 10 }} />
                        <View style={{ justifyContent: 'space-between' }}>
                            <Text style={{
                                fontSize: 16,
                                color: Theme.textColor, fontWeight: '600',
                            }}>
                                {`TON ${t('common.wallet')}`}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '400',
                                    color: Theme.price,
                                }}
                                selectable={false}
                                ellipsizeMode={'middle'}
                            >
                                {
                                    friendly.slice(0, 6)
                                    + '...'
                                    + friendly.slice(friendly.length - 6)
                                }
                            </Text>
                        </View>
                    </View>
                    <View style={{ height: 240, marginBottom: 38, justifyContent: 'center', alignItems: 'center' }}>
                        <QRCode data={link} size={240} />
                    </View>

                    <View style={{
                        justifyContent: 'center'
                    }}>
                        <CopyButton
                            body={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            style={{ marginBottom: 8 }}
                        />
                        <ShareButton body={link} />
                    </View>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});