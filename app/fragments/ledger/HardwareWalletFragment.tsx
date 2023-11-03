import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { RoundButton } from "../../components/RoundButton";
import LedgerIcon from '../../../assets/ic_ledger.svg';
import { openWithInApp } from "../../utils/openWithInApp";
import { useTheme } from '../../engine/hooks';
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";

export const HardwareWalletFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('hardwareWallet.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17,
                        color: theme.textPrimary
                    }, { textAlign: 'center' }]}>
                        {t('hardwareWallet.title')}
                    </Text>
                </View>
            )}
            <View style={{
                marginHorizontal: 16,
                marginBottom: safeArea.bottom + 16,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
            }}>
                <View style={{ flexGrow: 1 }} />
                <LedgerIcon
                    color={'black'}
                    width={64}
                    height={64}
                    style={{
                        margin: 16
                    }}
                />
                <Text style={{
                    color: theme.textPrimary,
                    fontWeight: '600',
                    fontSize: 18,
                    marginBottom: 16,
                    marginHorizontal: 8,
                    textAlign: 'center'
                }}>
                    {Platform.OS === 'android' && t('hardwareWallet.connectionDescriptionAndroid')}
                    {Platform.OS === 'ios' && t('hardwareWallet.connectionDescriptionIOS')}
                </Text>
                <View style={{ paddingHorizontal: 36, alignItems: 'center' }}>
                    <Text style={{
                        color: theme.textPrimary,
                        fontWeight: '400',
                        fontSize: 16,
                        textAlign: 'center'
                    }}>
                        {Platform.OS === 'android' && t('hardwareWallet.installationAndroid')}
                        {Platform.OS === 'ios' && t('hardwareWallet.installationIOS')}
                    </Text>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                                marginTop: 14
                            }
                        }}
                        onPress={() => openWithInApp('https://tonwhales.com/ledger')}
                    >
                        <Text style={{
                            color: theme.accent,
                            fontWeight: '600',
                            fontSize: 16,
                        }}>
                            {t('hardwareWallet.installationGuide')}
                        </Text>
                    </Pressable>
                </View>
                <View style={{ flexGrow: 1 }} />
                {Platform.OS === 'android' && (
                    <RoundButton
                        title={t('hardwareWallet.actions.connectHid')}
                        onPress={() => navigation.navigate('LedgerHID')}
                        style={{
                            width: '100%',
                            marginVertical: 4
                        }}
                    />
                )}
                <RoundButton
                    title={t('hardwareWallet.actions.connectBluetooth')}
                    onPress={() => navigation.navigate('LedgerBle')}
                    style={{
                        width: '100%',
                        marginVertical: 4
                    }}
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
    );
});