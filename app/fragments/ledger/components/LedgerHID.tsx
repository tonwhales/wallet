import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import TransportHID from "@ledgerhq/react-native-hid";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { LedgerSelectAccount } from "./LedgerSelectAccount";
import { useTransport } from "./LedgerTransportProvider";
import { useAppConfig } from "../../../utils/AppConfigContext";

export const LedgerHID = React.memo(() => {
    const { Theme } = useAppConfig();
    const [started, setStarted] = React.useState(false);
    const { setLedgerConnection, tonTransport } = useTransport();
    const [screen, setScreen] = useState<'select-account' | null>(null);

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
                    setLedgerConnection({ type: 'hid', transport: hid });
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
            {((!tonTransport || !screen)) && (
                <View style={{
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
                        fontWeight: '700',
                        fontSize: 20,
                        marginBottom: 32,
                        marginHorizontal: 16,
                        marginTop: 16
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
                <LedgerSelectAccount onReset={() => setLedgerConnection(null)} />
            )}
        </View>
    );
});