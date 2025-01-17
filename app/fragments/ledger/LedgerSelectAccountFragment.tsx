import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Alert, Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AccountButton } from "./components/AccountButton";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useAccountsLite, useNetwork, useBounceableWalletFormat, useTheme } from "../../engine/hooks";
import { LedgerWallet, useLedgerTransport } from "./components/TransportContext";
import { Address } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { delay } from 'teslabot';
import { ThemeType } from '../../engine/state/theme';
import { Typography } from '../../components/styles';
import { useFocusEffect } from "@react-navigation/native";
import { useParams } from "../../utils/useParams";

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: bigint };
type AccountsLite = ReturnType<typeof useAccountsLite>;

const LedgerAccountsList = ({ safeArea, theme, accountsLite, accs, selected, isTestnet, onLoadAccount, loading, bounceable }: {
    safeArea: EdgeInsets,
    theme: ThemeType,
    accountsLite: AccountsLite,
    accs: {
        address: Address;
        publicKey: Buffer;
    }[],
    selected?: number,
    isTestnet: boolean,
    loading: boolean,
    onLoadAccount: (acc: LedgerAccount) => Promise<void>,
    bounceable?: boolean
}) => {
    const ledgerContext = useLedgerTransport();

    return (
        <ScrollView
            contentInset={{ top: 0, bottom: safeArea.bottom + 16 }}
            contentOffset={{ y: 16 + safeArea.top, x: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
        >
            {loading ? (
                <>
                    <View style={{
                        height: 86,
                        borderRadius: 20,
                        backgroundColor: theme.surfaceOnElevation,
                        justifyContent: 'center', padding: 20,
                        marginBottom: 16
                    }}>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: 16, height: 16, width: '45%'
                        }} />
                        <View style={{
                            backgroundColor: 'white',
                            marginTop: 8,
                            borderRadius: 16, height: 24, width: '60%'
                        }} />
                    </View>
                    <View style={{
                        height: 86,
                        borderRadius: 20,
                        backgroundColor: theme.surfaceOnElevation,
                        justifyContent: 'center', padding: 20,
                        marginBottom: 16
                    }}>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: 16, height: 16, width: '45%'
                        }} />
                        <View style={{
                            backgroundColor: 'white',
                            marginTop: 8,
                            borderRadius: 16, height: 24, width: '60%'
                        }} />
                    </View>
                    <View style={{
                        height: 86,
                        borderRadius: 20,
                        backgroundColor: theme.surfaceOnElevation,
                        justifyContent: 'center', padding: 20,
                        marginBottom: 16
                    }}>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: 16, height: 16, width: '45%'
                        }} />
                        <View style={{
                            backgroundColor: 'white',
                            marginTop: 8,
                            borderRadius: 16, height: 24, width: '60%'
                        }} />
                    </View>
                </>
            ) : (
                accountsLite.map((acc) => {
                    if (ledgerContext?.ledgerWallets?.some((a) => Address.parse(a.address).equals(acc.address))) {
                        return null;
                    }
                    const item = accs.find((a) => a.address.equals(acc.address));
                    return (
                        <AccountButton
                            key={acc.address.toString()}
                            loadingAcc={selected}
                            onSelect={onLoadAccount}
                            acc={{
                                i: accs.findIndex((a) => a.address.equals(acc.address)),
                                addr: {
                                    address: acc.address.toString({ testOnly: isTestnet, bounceable: bounceable }),
                                    publicKey: item!.publicKey || Buffer.from([]),
                                },
                                balance: BigInt(acc.data?.balance.coins || 0),
                            }}
                        />
                    )
                })
            )}
            <View style={{ height: 56 }} />
        </ScrollView>
    );
}

const LedgerHint = ({ state, theme }: { state: 'locked-device' | 'closed-app' | 'active' | 'loading', theme: ThemeType }) => {
    const [dotCount, setDotCount] = useState<number>(0);

    // dot animation
    useEffect(() => {
        if (state !== 'closed-app' && state !== 'locked-device') {
            setDotCount(0);
            return;
        }

        let interval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4);
        }, 300);

        return () => {
            clearInterval(interval);
        }
    }, [state]);

    let text = t('hardwareWallet.chooseAccountDescription');
    if (state === 'active' || state === 'loading') {
        text = t('hardwareWallet.chooseAccountDescription');
    }

    if (state === 'locked-device') {
        text = t('hardwareWallet.unlockLedgerDescription');
    }

    if (state == 'closed-app') {
        text = t('hardwareWallet.openTheAppDescription');
    }

    text += new Array(dotCount).fill('.').join('');

    return (
        <Text style={[{ color: theme.textSecondary, marginBottom: 16, marginHorizontal: 16 }, Typography.regular17_24]}>
            {text}
        </Text>
    );
}

export type LedgerSelectAccountParams = {
    selectedAddress?: LedgerWallet | null
};

export const LedgerSelectAccountFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();
    const [bounceableFormat] = useBounceableWalletFormat();
    const { selectedAddress } = useParams<LedgerSelectAccountParams>();

    const [selected, setSelected] = useState<number>();
    const [accs, setAccounts] = useState<{
        address: Address;
        publicKey: Buffer;
    }[]>([]);

    const accountsLite = useAccountsLite(accs.map((a) => a.address));

    const [connectionState, setConnectionState] = useState<'locked-device' | 'closed-app' | 'active' | 'loading'>('loading');

    useEffect(() => {
        let cancelled = false;
        let cancelWork = () => {
            cancelled = true;
        };

        if (!!ledgerContext?.tonTransport) {
            (async () => {
                while (!cancelled) {
                    const res: { address: Address, publicKey: Buffer }[] = [];
                    const run = Array.from({ length: 10 }).map((_, i) => i);
                    try {
                        let isAppOpen = await ledgerContext.tonTransport?.isAppOpen();
                        if (cancelled) return;

                        if (!isAppOpen) {
                            console.warn('[ledger] closed app');
                            setConnectionState('closed-app');
                            return;
                        }

                        setConnectionState('loading');
                        for (const i of run) {
                            const path = pathFromAccountNumber(i, network.isTestnet);
                            const addr = await ledgerContext.tonTransport!.getAddress(path, { testOnly: network.isTestnet });
                            if (cancelled) return;

                            const address = Address.parse(addr.address);
                            res.push({ address, publicKey: addr.publicKey });
                        }

                        setAccounts(res);
                        setConnectionState('active');
                        return;
                    } catch (e) {
                        if (e instanceof Error && e.name === 'LockedDeviceError') {
                            console.warn('[ledger] locked device');
                            setConnectionState('locked-device');
                        }

                        await delay(1000);
                    }
                }
            })();
        }

        return cancelWork;
    }, [ledgerContext?.tonTransport]);

    const onLoadAccount = useCallback((async (acc: LedgerAccount) => {
        if (!ledgerContext?.tonTransport) {
            Alert.alert(t('hardwareWallet.errors.noDevice'));
            ledgerContext?.setLedgerConnection(null);
            return;
        }
        setSelected(acc.i);
        let path = pathFromAccountNumber(acc.i, network.isTestnet);
        try {
            await ledgerContext.tonTransport.validateAddress(path, { testOnly: network.isTestnet });
            ledgerContext.setAddr({ address: acc.addr.address, publicKey: acc.addr.publicKey, acc: acc.i });
            navigation.navigateLedgerApp();
            setSelected(undefined);
        } catch (e) {
            setSelected(undefined);
            let isAppOpen = await ledgerContext.tonTransport?.isAppOpen();

            if (!isAppOpen) {
                console.warn('[ledger] closed app');
                setConnectionState('closed-app');
                return;
            }

            if (e instanceof Error && e.name === 'LockedDeviceError') {
                console.warn('[ledger] locked device');
                setConnectionState('locked-device');
            }
        }
    }), [ledgerContext?.tonTransport]);

    // Reseting ledger context on back navigation if no address selected
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (!ledgerContext.addr) {
                    const lastConnectionType = ledgerContext.ledgerConnection?.type;
                    ledgerContext.reset();

                    // Restart new search, we are navigating back to the search screen
                    if (lastConnectionType === 'ble') {
                        ledgerContext.startBleSearch();
                    } else if (lastConnectionType === 'hid') {
                        ledgerContext.startHIDSearch();
                    }
                }
            };

            navigation.base.addListener('beforeRemove', onBackPress);

            return () => {
                navigation.base.removeListener('beforeRemove', onBackPress);
            };
        }, [navigation, ledgerContext])
    );

    return (
        <View style={{
            flex: 1,
        }}>
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
                {ledgerContext?.tonTransport?.transport.deviceModel?.productName}
            </Text>
            <LedgerHint state={connectionState} theme={theme} />
            {(connectionState === 'active' || connectionState === 'loading') && (
                <LedgerAccountsList
                    accountsLite={accountsLite}
                    accs={accs}
                    isTestnet={network.isTestnet}
                    onLoadAccount={onLoadAccount}
                    safeArea={safeArea}
                    selected={selected}
                    theme={theme}
                    loading={(!accountsLite || accountsLite.length === 0) || connectionState === 'loading'}
                    bounceable={bounceableFormat}
                />
            )}
        </View>
    );
});