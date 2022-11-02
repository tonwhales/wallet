import React from "react";
import { View, Text } from "react-native";
import { TonTransport } from "ton-ledger";
import { useEngine } from "../../engine/Engine";
import TransportHID from "@ledgerhq/react-native-hid";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { AppConfig } from "../../AppConfig";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { LedgerApp } from "./LedgerApp";
import { Theme } from "../../Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const LedgerHIDComponent = React.memo(({ onReset }: { onReset: () => void }) => {
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();

    const [started, setStarted] = React.useState(false);
    const [account, setAccount] = React.useState<number | null>(null);
    const [address, setAddress] = React.useState<{ address: string, publicKey: Buffer } | null>(null);
    const [device, setDevice] = React.useState<TonTransport | null>(null);

    let reset = React.useCallback(() => {
        setDevice(null);
        setAccount(null);
        setAddress(null);
    }, []);

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
                    console.warn(hid.deviceModel);
                    setDevice(new TonTransport(hid));
                } catch (e) {
                    console.warn(e);
                    setStarted(false);
                    started = false;
                }
            })()
        };
    }, [started]);

    const onLoadAccount = React.useCallback(
        (async () => {
            if (!device) {
                return;
            }
            if (account === null) {
                return;
            }
            let path = pathFromAccountNumber(account);
            console.log({ device, account, path });
            try {
                let address = await device.getAddress(path, { testOnly: AppConfig.isTestnet });
                console.log({ address });
                await device.validateAddress(path, { testOnly: AppConfig.isTestnet });
                setAddress(address);
            } catch (e) {
                console.warn(e);
                reset();
            }
        }),
        [device, account],
    );

    return (
        <View style={{ flexGrow: 1 }}>
            {!device && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    alignItems: 'center',
                    padding: 16,
                }}>
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '600',
                        fontSize: 18,
                        marginBottom: 16,
                    }}>
                        {/* {Platform.OS === 'android' && t('hardwareWallet.connectionDescriptionAndroid')}
                        {Platform.OS === 'ios' && t('hardwareWallet.connectionDescriptionIOS')} */}
                        {t('hardwareWallet.connectionHIDDescription')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.connect')}
                        onPress={doStart}
                        style={{
                            width: '100%',
                        }}
                    />
                </View>
            )}
            {!!device && account === null && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 18,
                        color: Theme.textColor,
                        marginBottom: 16,
                        textAlign: 'center'
                    }}>
                        {t('hardwareWallet.chooseAccountDescription')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 0 })}
                        onPress={() => setAccount(0)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 1 })}
                        onPress={() => setAccount(1)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 2 })}
                        onPress={() => setAccount(2)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 3 })}
                        onPress={() => setAccount(3)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 4 })}
                        onPress={() => setAccount(4)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 5 })}
                        onPress={() => setAccount(5)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                    <RoundButton
                        title={t('hardwareWallet.actions.account', { account: 6 })}
                        onPress={() => setAccount(6)}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                </View>
            )}
            {!!device && account !== null && address === null && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 18,
                        color: Theme.textColor,
                        marginBottom: 16
                    }}>
                        {t('hardwareWallet.openAppVerifyAddress')}
                    </Text>
                    <RoundButton
                        title={t('hardwareWallet.actions.loadAddress')}
                        action={onLoadAccount}
                        style={{
                            width: '100%',
                            margin: 4
                        }}
                    />
                </View>
            )}
            {device && account !== null && address !== null && (
                <LedgerApp
                    transport={device}
                    account={account}
                    address={address}
                    tonClient4={engine.client4}
                />
            )}
            {(!device || account === null || address === null) && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: safeArea.bottom ?? 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Theme.background,
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display="secondary"
                        size="normal"
                        style={{ paddingHorizontal: 8 }}
                        onPress={onReset}
                    />
                </View>
            )}
        </View>
    );
});