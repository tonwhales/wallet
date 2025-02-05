import React, { useCallback, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { t } from "../../i18n/t";
import { BleDevice } from "./components/BleDevice";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { LedgerWallet, useLedgerTransport } from "./components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Typography } from "../../components/styles";
import { useParams } from "../../utils/useParams";
import { useToaster } from "../../components/toast/ToastProvider";

export type LedgerDeviceSelectionParams = {
    selectedAddress?: LedgerWallet | null
}

export const LedgerDeviceSelectionFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const { selectedAddress } = useParams<LedgerDeviceSelectionParams>();
    const toaster = useToaster();

    const devices = (
        (ledgerContext?.bleSearchState?.type === 'completed' && ledgerContext?.bleSearchState?.success)
        || (ledgerContext?.bleSearchState?.type === 'ongoing') && ledgerContext?.bleSearchState.devices.length > 0
    ) ? ledgerContext.bleSearchState.devices : [];

    const onDeviceSelect = useCallback(async (device: any) => {
        try {
            toaster.show({
                type: 'success',
                message: t('syncStatus.online'),
                marginBottom: 32
            });
            const transport = await TransportBLE.open(device.id);
            ledgerContext.reset();
            ledgerContext?.setLedgerConnection({ type: 'ble', transport, device });
        } catch (error) {
            console.warn('Error connecting to device', error);
        }
    }, [ledgerContext]);

    const newScan = useCallback(() => {
        ledgerContext?.startBleSearch();
    }, [ledgerContext]);

    useEffect(() => {
        newScan();
    }, []);

    useEffect(() => {
        if (ledgerContext?.ledgerConnection?.type === 'ble') {
            if (!selectedAddress) {
                navigation.navigate('LedgerSelectAccount');
                return;
            }
            navigation.goBack();
        }
    }, [ledgerContext?.ledgerConnection, selectedAddress]);

    // Reseting ledger context on back navigation & stoping all searches
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (ledgerContext?.ledgerConnection?.type !== 'ble') {
                    ledgerContext.reset();
                }
            };

            navigation.base.addListener('beforeRemove', onBackPress);

            return () => {
                navigation.base.removeListener('beforeRemove', onBackPress);
            };
        }, [navigation, ledgerContext])
    );

    if (ledgerContext?.bleSearchState?.type === 'permissions-failed') {
        return (
            <View style={{ flexGrow: 1 }}>
                <StatusBar style={Platform.select({
                    android: theme.style === 'dark' ? 'light' : 'dark',
                    ios: 'light'
                })} />
                <ScreenHeader
                    title={t('hardwareWallet.title')}
                    onBackPressed={navigation.goBack}
                    style={[
                        { paddingHorizontal: 16 },
                        Platform.select({ android: { paddingTop: safeArea.top } })
                    ]}
                />
                <Text style={[{
                    marginHorizontal: 16,
                    marginVertical: 16,
                    textAlign: 'center'
                }, Typography.semiBold17_24]}>
                    {t('hardwareWallet.errors.permissions')}
                </Text>
                <RoundButton
                    title={t('hardwareWallet.actions.givePermissions')}
                    action={async () => {
                        const checkCoarse = await checkMultiple([
                            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                        ]);

                        if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                            || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                            const requestLocation = await requestMultiple([
                                PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                            ]);
                            if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                                || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }

                        const scanConnect = await checkMultiple([
                            PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                        ]);

                        if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                            || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                            let resScanConnect = await requestMultiple([
                                PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                                PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                            ]);
                            if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                                || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }
                    }}
                    style={{
                        marginBottom: safeArea.bottom + 16,
                        marginHorizontal: 16,
                    }}
                />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('hardwareWallet.title')}
                onBackPressed={navigation.goBack}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
            />
            <Text style={[{ color: theme.textPrimary, marginVertical: 16, marginHorizontal: 16 }, Typography.semiBold32_38]}>
                {t('hardwareWallet.devices')}
            </Text>
            <ScrollView style={{ flexGrow: 1 }}>
                {devices.map((device: any) => {
                    return (
                        <BleDevice
                            key={`ledger-${device.id}`}
                            device={device}
                            onSelect={onDeviceSelect}
                        />
                    );
                })}
                <View style={{ height: 16 }} />
            </ScrollView>
            <View style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: safeArea.bottom === 0 ? 40 : safeArea.bottom + 16,
                left: 0, right: 0,
                alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 16
            }}>
                <RoundButton
                    title={t('hardwareWallet.actions.scanBluetooth')}
                    size={'large'}
                    style={{ width: '100%' }}
                    onPress={newScan}
                />
            </View>
        </View>
    )
});