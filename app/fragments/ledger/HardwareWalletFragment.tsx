import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { RoundButton } from "../../components/RoundButton";
import { openWithInApp } from "../../utils/openWithInApp";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useLedgerTransport } from "./components/LedgerTransportProvider";

export const HardwareWalletFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();

    const [searching, setSearching] = useState(false);
    const [bleLocked, setBleLocked] = useState(false);

    const searchHID = useCallback(async () => {
        setBleLocked(true);
        await ledgerContext?.startHIDSearch();
    }, [ledgerContext]);

    const searchBLE = useCallback(() => {
        ledgerContext?.startBleSearch();
    }, [ledgerContext]);

    useEffect(() => {
        if (ledgerContext?.bleSearchState?.type === 'ongoing') {
            setSearching(true);
            if (ledgerContext.bleSearchState.devices.length > 0) {
                navigation.navigate('LedgerDeviceSelection');
                setSearching(false);
            }
        } else if (ledgerContext?.bleSearchState?.type === 'completed' && ledgerContext.bleSearchState.success) {
            navigation.navigate('LedgerDeviceSelection');
            setSearching(false);
        } else {
            setSearching(false);
        }
    }, [ledgerContext?.bleSearchState]);

    useEffect(() => {
        if (ledgerContext?.ledgerConnection?.type === 'hid') {
            navigation.navigate('LedgerSelectAccount');
        }
    }, [ledgerContext?.ledgerConnection]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('hardwareWallet.title')}
                onBackPressed={navigation.goBack}
            />
            {Platform.OS === 'ios' && (
                <View style={{ paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', marginTop: 41, marginBottom: 33 }}>
                    <Image source={require('../../../assets/ledger_ios.webp')} />
                </View>
            )}
            {Platform.OS === 'android' && (
                <View style={{ paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', marginTop: 41, marginBottom: 33 }}>
                    <Image source={require('../../../assets/and_ledger.webp')} />
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
                <Text style={{
                    color: Theme.textColor,
                    fontWeight: '600',
                    fontSize: 32, lineHeight: 38,
                    marginBottom: 16,
                    marginHorizontal: 8,
                    textAlign: 'center'
                }}>
                    {Platform.OS === 'android' && t('hardwareWallet.connectionDescriptionAndroid')}
                    {Platform.OS === 'ios' && t('hardwareWallet.connectionDescriptionIOS')}
                </Text>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{
                        color: Theme.darkGrey,
                        fontWeight: '400',
                        fontSize: 17, lineHeight: 24,
                        textAlign: 'center'
                    }}>
                        {t('hardwareWallet.installation')}
                    </Text>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                            }
                        }}
                        onPress={() => openWithInApp('https://tonwhales.com/ledger')}
                    >
                        <Text style={{
                            color: Theme.accent,
                            fontWeight: '500',
                            fontSize: 17, lineHeight: 24,
                        }}>
                            {t('hardwareWallet.installationGuide')}
                        </Text>
                    </Pressable>
                </View>
                <View style={{ flexGrow: 1 }} />
                {Platform.OS === 'android' && (
                    <RoundButton
                        title={t('hardwareWallet.actions.connectHid')}
                        action={searchHID}
                        style={{
                            width: '100%',
                            marginVertical: 4
                        }}
                    />
                )}
                <RoundButton
                    title={Platform.OS === 'android' ? t('hardwareWallet.actions.connectBluetooth') : t('hardwareWallet.actions.connect')}
                    onPress={searchBLE}
                    disabled={bleLocked}
                    loading={searching}
                    style={{
                        width: '100%',
                        marginVertical: 4
                    }}
                />
            </View>
        </View>
    );
});