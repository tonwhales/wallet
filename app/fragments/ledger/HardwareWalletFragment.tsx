import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { TonPayloadFormat, TonTransport } from 'ton-ledger';
import TransportHID from "@ledgerhq/react-native-hid";
import { AppConfig } from "../../AppConfig";
import { useEngine } from "../../engine/Engine";
import { ItemButton } from "../../components/ItemButton";
import { LedgerApp } from "./LedgerApp";
import { Theme } from "../../Theme";
import { RoundButton } from "../../components/RoundButton";
import LedgerIcon from '../../../assets/ic_ledger.svg';
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";

export const HardwareWalletFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();

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

    let [addr, setAddr] = React.useState<string | null>(null);

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
                setAddr(address.address);
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
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('hardwareWallet.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('hardwareWallet.title')}
                    </Text>
                </View>
            )}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    paddingHorizontal: 16,
                    flexBasis: 0,
                    marginBottom: 52 + safeArea.bottom
                }}
            >
                {!device && (
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        flexGrow: 1,
                    }}>
                        <LedgerIcon
                            height={52}
                            width={52}
                            color={'black'}
                            style={{
                                margin: 8
                            }}
                        />
                        <RoundButton
                            title={'Connect Ledger'}
                            onPress={doStart}
                            style={{
                                width: '100%',
                            }}
                        />
                    </View>
                )}
                {!!device && account === null && (
                    <View style={{
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
                            {t('hardwareWallet.actions.selectAccount')}
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
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 16
                    }}>
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
                        reset={reset}
                        address={address}
                        tonClient4={engine.client4}
                    />
                )}
            </ScrollView>
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