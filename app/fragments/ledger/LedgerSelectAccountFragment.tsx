import BN from "bn.js";
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AccountButton } from "./components/AccountButton";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { useAppConfig } from "../../utils/AppConfigContext";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: BN };

export const LedgerSelectAccountFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number>();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);

    useEffect(() => {
        (async () => {
            if (!ledgerContext?.tonTransport) {
                return;
            }
            const proms: Promise<LedgerAccount>[] = [];
            const seqno = (await engine.client4.getLastBlock()).last.seqno;
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i, AppConfig.isTestnet);
                    const addr = await ledgerContext.tonTransport!.getAddress(path, { testOnly: AppConfig.isTestnet });
                    try {
                        const address = Address.parse(addr.address);
                        const liteAcc = await engine.client4.getAccountLite(seqno, address);
                        return { i, addr, balance: new BN(liteAcc.account.balance.coins, 10) };
                    } catch (error) {
                        return { i, addr, balance: new BN(0) };
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
            let path = pathFromAccountNumber(acc.i, AppConfig.isTestnet);
            try {
                await ledgerContext.tonTransport.validateAddress(path, { testOnly: AppConfig.isTestnet });
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
                color: Theme.textPrimary,
                fontWeight: '600',
                fontSize: 32, lineHeight: 38,
                marginVertical: 16, marginHorizontal: 16
            }}>
                {ledgerContext?.tonTransport?.transport.deviceModel?.productName}
            </Text>
            <Text style={{
                fontWeight: '400',
                fontSize: 17, lineHeight: 24,
                color: Theme.textSecondary,
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
                            backgroundColor: Theme.border,
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
                            backgroundColor: Theme.border,
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
                            backgroundColor: Theme.border,
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