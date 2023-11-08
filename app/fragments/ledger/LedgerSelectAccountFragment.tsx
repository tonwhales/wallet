import BN from "bn.js";
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AccountButton } from "./components/AccountButton";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useClient4, useNetwork, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { getLastBlock } from "../../engine/accountWatcher";
import { Address } from "@ton/core";

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: bigint };

export const LedgerSelectAccountFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();
    const client = useClient4(network.isTestnet);

    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number>();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);

    useEffect(() => {
        (async () => {
            if (!ledgerContext?.tonTransport) {
                return;
            }
            const proms: Promise<LedgerAccount>[] = [];
            const seqno = (await getLastBlock());
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i, network.isTestnet);
                    const addr = await ledgerContext.tonTransport!.getAddress(path, { testOnly: network.isTestnet });
                    try {
                        const address = Address.parse(addr.address);
                        const liteAcc = await client.getAccountLite(seqno, address);
                        return { i, addr, balance: BigInt(liteAcc.account.balance.coins) };
                    } catch (error) {
                        return { i, addr, balance: 0n };
                    }
                })());
            }
            const res = await Promise.all(proms);
            setAccounts(res);
            setLoading(false);
        })();
    }, [ledgerContext?.tonTransport]);

    const onLoadAccount = React.useCallback(
        (async (acc: LedgerAccount) => {
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
                setSelected(undefined);
            } catch (e) {
                warn(e);
                // onReset();
                setSelected(undefined);
            }
        }),
        [ledgerContext?.tonTransport],
    );

    useEffect(() => {
        if (!!ledgerContext?.addr) {
            navigation.navigateLedgerApp();
        }
    }, [ledgerContext?.addr]);

    return (
        <View style={{
            flex: 1,
        }}>
            <ScreenHeader
                title={t('hardwareWallet.title')}
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />
            <Text style={{
                color: theme.textPrimary,
                fontWeight: '600',
                fontSize: 32, lineHeight: 38,
                marginVertical: 16, marginHorizontal: 16
            }}>
                {ledgerContext?.tonTransport?.transport.deviceModel?.productName}
            </Text>
            <Text style={{
                fontWeight: '400',
                fontSize: 17, lineHeight: 24,
                color: theme.textSecondary,
                marginBottom: 16,
                marginHorizontal: 16
            }}>
                {t('hardwareWallet.chooseAccountDescription')}
            </Text>
            <ScrollView
                contentInset={{ top: 0, bottom: safeArea.bottom + 16 }}
                contentOffset={{ y: 16 + safeArea.top, x: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {loading && (
                    <>
                        <View style={{
                            height: 86,
                            borderRadius: 20,
                            backgroundColor: theme.border,
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
                            backgroundColor: theme.border,
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
                            backgroundColor: theme.border,
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
                )}
                {accounts.map((acc) => (
                    <AccountButton
                        key={acc.i}
                        loadingAcc={selected}
                        onSelect={onLoadAccount}
                        acc={acc}
                    />
                ))}
                <View style={{ height: 56 }} />
            </ScrollView>
        </View>
    );
});