import React, { useCallback, useMemo, useState } from "react";
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
import { useDimensions } from "@react-native-community/hooks";
import { useTransport } from "./components/LedgerTransportProvider";
import TransportHID from "@ledgerhq/react-native-hid";

type BLEState = { type: 'ongoing' } | { type: 'completed', success: boolean } | { type: 'permissions-failed' }

export const HardwareWalletFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const dimentions = useDimensions().window;

    const [searching, setSearching] = useState(false);

    const ledgerContext = useTransport();

    const searchHID = useCallback(async () => {
        try {
            setSearching(true);
            let hid = await TransportHID.create();
            ledgerContext?.setLedgerConnection({ type: 'hid', transport: hid });
            setSearching(false);
        } catch (e) {
            setSearching(false);
        }
    }, [ledgerContext]);

    const [scan, setScan] = useState<BLEState>();
    const [devices, setDevices] = useState([]);

    const searchBLE = useCallback(async () => {
        setScan({ type: 'ongoing' });
    }, [ledgerContext]);

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
            <Image
                source={require('../../../assets/ic_ledger_x.png')}
                style={{
                    width: dimentions.width,
                    height: dimentions.width,
                }}
            />
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
                    <>
                        <RoundButton
                            title={t('hardwareWallet.actions.connectHid')}
                            action={searchHID}
                            style={{
                                width: '100%',
                                marginVertical: 4
                            }}
                        />
                        <RoundButton
                            title={t('hardwareWallet.actions.connectBluetooth')}
                            onPress={() => navigation.navigate('LedgerBle')}
                            style={{
                                width: '100%',
                                marginVertical: 4
                            }}
                        />
                    </>
                )}
                {Platform.OS === 'ios' && (
                    <RoundButton
                        title={t('hardwareWallet.actions.connect')}
                        onPress={() => navigation.navigate('LedgerBle')}
                        style={{
                            width: '100%',
                            marginVertical: 4
                        }}
                    />
                )}
            </View>
        </View>
    );
});