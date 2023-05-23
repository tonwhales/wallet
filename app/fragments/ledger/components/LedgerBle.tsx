import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { View, LayoutAnimation } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { LedgerDeviceSelection } from "./LedgerDeviceSelection";
import { LedgerDevice } from "./BleDevice";
import { LedgerSelectAccount } from "./LedgerSelectAccount";
import { useTransport } from "./TransportContext";
import { LedgerBleDescription } from "./LedgerBleDescription";

type StepScreen = 'scan' | 'select-account' | 'description';

export const LedgerBle = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const { ledgerConnection, setLedgerConnection, tonTransport, addr } = useTransport();
    const [screen, setScreen] = useState<StepScreen>('description');

    const onSelectDevice = useCallback(async (device: LedgerDevice) => {
        const transport = await TransportBLE.open(device.id);
        setLedgerConnection({ type: 'ble', transport });
    }, []);

    const onScan = useCallback(async () => {
        setScreen('scan');
    }, []);

    useEffect(() => {
        if (!ledgerConnection) {
            setScreen('description');
            return;
        }
        if (tonTransport) {
            setScreen('select-account');
        }
    }, [ledgerConnection, tonTransport]);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [screen]);

    return (
        <View style={{ flexGrow: 1 }}>
            {screen === 'description' && (
                <LedgerBleDescription onScan={onScan} />
            )}
            {screen === 'scan' && (
                <LedgerDeviceSelection
                    onReset={() => {
                        setLedgerConnection(null);
                        setScreen('description');
                    }}
                    onSelectDevice={onSelectDevice}
                />
            )}

            {(!!tonTransport && screen === 'select-account') && (
                <LedgerSelectAccount
                    onReset={() => {
                        setLedgerConnection(null)
                        setScreen('description');
                    }}
                />
            )}

            {!!ledgerConnection && (
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