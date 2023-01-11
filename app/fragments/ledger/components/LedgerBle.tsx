import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { LedgerDeviceSelection } from "./LedgerDeviceSelection";
import { LedgerDevice } from "./BleDevice";
import { LedgerSelectAccount } from "./LedgerSelectAccount";
import { useTransport } from "./TransportContext";

export const LedgerBle = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const { ledgerConnection, setLedgerConnection, tonTransport, addr } = useTransport();
    const [screen, setScreen] = useState<'scan' | 'select-account' | null>(null);

    const onSelectDevice = useCallback(async (device: LedgerDevice) => {
        const transport = await TransportBLE.open(device.id);
        setLedgerConnection({ type: 'ble', transport });
    }, []);

    const onScan = useCallback(async () => {
        setScreen('scan');
    }, []);

    useEffect(() => {
        if (!ledgerConnection) {
            setScreen(null);
            return;
        }
        if (tonTransport) {
            setScreen('select-account');
        }
    }, [ledgerConnection, tonTransport]);

    return (
        <View style={{ flexGrow: 1 }}>
            {(screen !== 'scan' && !tonTransport) && (
                <>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        flexGrow: 1,
                    }}>
                        <View style={{ flexGrow: 1 }} />
                        <Image style={{ width: 204, height: 204 }}
                            source={require('../../../../assets/ic_ledger_x.png')}
                        />
                        <Text style={{
                            color: Theme.textColor,
                            fontWeight: '600',
                            fontSize: 18,
                            marginBottom: 32,
                            marginHorizontal: 16
                        }}>
                            {t('hardwareWallet.actions.connect')}
                        </Text>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={{
                                color: Theme.textColor,
                                fontWeight: '400',
                                fontSize: 16,
                                marginBottom: 12,
                            }}>
                                {t('hardwareWallet.bluetoothScanDescription_1')}
                            </Text>
                            <Text style={{
                                color: Theme.textColor,
                                fontWeight: '400',
                                fontSize: 16,
                                marginBottom: 12,
                            }}>
                                {t('hardwareWallet.bluetoothScanDescription_2')}
                            </Text>
                            <Text style={{
                                color: Theme.textColor,
                                fontWeight: '400',
                                fontSize: 16,
                                marginBottom: 12,
                            }}>
                                {t('hardwareWallet.bluetoothScanDescription_3')}
                            </Text>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                    <RoundButton
                        title={t('hardwareWallet.actions.scanBluetooth')}
                        onPress={onScan}
                        style={{
                            marginBottom: safeArea.bottom + 16,
                            marginHorizontal: 16,
                        }}
                    />
                </>
            )}
            {screen === 'scan' && (
                <LedgerDeviceSelection onReset={() => setLedgerConnection(null)} onSelectDevice={onSelectDevice} />
            )}

            {(!!tonTransport && screen === 'select-account') && (
                <LedgerSelectAccount reset={() => setLedgerConnection(null)} />
            )}

            {(!!tonTransport || addr) && !(tonTransport && addr !== null) && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: safeArea.bottom + 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display="secondary"
                        size="normal"
                        style={{ paddingHorizontal: 8 }}
                        onPress={() => setLedgerConnection(null)}
                    />
                </View>
            )}
        </View>
    );
});