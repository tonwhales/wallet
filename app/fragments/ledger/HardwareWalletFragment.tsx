import React, { useCallback, useEffect, useState } from "react";
import { Platform, View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { RoundButton } from "../../components/RoundButton";
import { openWithInApp } from "../../utils/openWithInApp";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useDimensions } from "@react-native-community/hooks";
import { useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { ScrollView } from "react-native-gesture-handler";

const images = {
    ios: {
        light: require('@assets/ledger/ledger-ios.webp'),
        dark: require('@assets/ledger/ledger-ios-dark.webp')
    },
    android: {
        light: require('@assets/ledger/ledger-and.webp'),
        dark: require('@assets/ledger/ledger-and-dark.webp')
    }
}

export const HardwareWalletFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const dimentions = useDimensions();

    const [searching, setSearching] = useState(false);
    const [bleLocked, setBleLocked] = useState(false);

    const searchHID = useCallback(async () => {
        setBleLocked(true);
        await ledgerContext?.startHIDSearch(navigation);
        setBleLocked(false);
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
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('hardwareWallet.title')}
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />
            <ScrollView>
                <View style={{
                    paddingHorizontal: 16,
                    justifyContent: 'center', alignItems: 'center',
                    marginTop: 41, marginBottom: 33
                }}>
                    <Image
                        style={{
                            width: dimentions.screen.width - 32,
                            height: dimentions.screen.width - 32,
                            overflow: 'hidden'
                        }}
                        height={dimentions.screen.width - 32}
                        width={dimentions.screen.width - 32}
                        source={
                            images[Platform.OS === 'android' ? 'android' : 'ios'][theme.style]
                        }
                        resizeMode={'contain'}
                    />
                </View>
                <View style={{
                    marginHorizontal: 16,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexGrow: 1,
                }}>
                    <Text style={{
                        color: theme.textPrimary,
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
                            color: theme.textSecondary,
                            fontWeight: '400',
                            fontSize: 17, lineHeight: 24,
                            textAlign: 'center'
                        }}>
                            {t(`hardwareWallet.${Platform.OS === 'android' ? 'installationAndroid' : 'installationIOS'}`)}
                        </Text>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => openWithInApp('https://tonwhales.com/ledger')}
                        >
                            <Text style={{
                                color: theme.accent,
                                fontWeight: '500',
                                fontSize: 17, lineHeight: 24,
                            }}>
                                {t('hardwareWallet.installationGuide')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
                <View style={{ height: 16 }} />
            </ScrollView>
            <View style={{ flexGrow: 1 }} />
            <View style={{
                marginBottom: safeArea.bottom + 16,
                paddingHorizontal: 16
            }}>
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