import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import TransportHID from "@ledgerhq/react-native-hid";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { LedgerSelectAccount } from "./LedgerSelectAccount";
import { TypedTransport, useTransport } from "./TransportContext";

export const LedgerHID = React.memo(() => {
    const [started, setStarted] = React.useState(false);
    const { setLedgerConnection, tonTransport } = useTransport();
    const [screen, setScreen] = useState<'select-account' | 'load-address' | null>(null);

    const doStart = React.useMemo(() => {
        let started = false;
        return () => {
            if (started) {
                return;
            }
            started = true;
            setStarted(true);

            // Start
            (async () => {
                try {
                    let hid = await TransportHID.create();
                    setLedgerConnection({ type: 'hid', transport: hid } as TypedTransport);
                    setScreen('select-account');
                } catch (e) {
                    started = false;
                    console.warn(e);
                    setStarted(false);
                }
            })();
        };
    }, [started]);

    return (
        <View style={{ flexGrow: 1 }}>
            {!tonTransport && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    padding: 16,
                    flexGrow: 1,
                }}>
                    <View style={{ flexGrow: 1 }} />
                    <Image style={{ width: 204, height: 204 }}
                        source={require('../../../../assets/ic_ledger_s.png')}
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
                            {t('hardwareWallet.connectionHIDDescription_1')}
                        </Text>
                        <Text style={{
                            color: Theme.textColor,
                            fontWeight: '400',
                            fontSize: 16,
                            marginBottom: 12,
                        }}>
                            {t('hardwareWallet.connectionHIDDescription_2')}
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    <RoundButton
                        title={t('common.continue')}
                        onPress={doStart}
                        style={{ width: '100%' }}
                    />
                </View>
            )}
            {(!!tonTransport && screen === 'select-account') && (
                <LedgerSelectAccount reset={() => setLedgerConnection(null)} />
            )}
        </View>
    );
});