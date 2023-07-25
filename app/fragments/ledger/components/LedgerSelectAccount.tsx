import BN from "bn.js";
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { useEngine } from "../../../engine/Engine";
import { t } from "../../../i18n/t";
import { warn } from "../../../utils/log";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { AccountButton } from "./AccountButton";
import { useTransport } from "./LedgerTransportProvider";
import { useAppConfig } from "../../../utils/AppConfigContext";

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: BN };

export const LedgerSelectAccount = React.memo(({ onReset }: { onReset: () => void }) => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const { tonTransport, setAddr, addr } = useTransport();
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number>();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);

    useEffect(() => {
        (async () => {
            if (!tonTransport) {
                return;
            }
            const proms: Promise<LedgerAccount>[] = [];
            const seqno = (await engine.client4.getLastBlock()).last.seqno;
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i, AppConfig.isTestnet);
                    const addr = await tonTransport.getAddress(path, { testOnly: AppConfig.isTestnet });
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
    }, [tonTransport]);

    const onLoadAccount = React.useCallback(
        (async (acc: LedgerAccount) => {
            if (!tonTransport) {
                Alert.alert(t('hardwareWallet.errors.noDevice'));
                onReset();
                return;
            }
            setSelected(acc.i);
            let path = pathFromAccountNumber(acc.i, AppConfig.isTestnet);
            try {
                await tonTransport.validateAddress(path, { testOnly: AppConfig.isTestnet });
                setAddr({ address: acc.addr.address, publicKey: acc.addr.publicKey, acc: acc.i });
                setSelected(undefined);
            } catch (e) {
                warn(e);
                onReset();
                setSelected(undefined);
            }
        }),
        [tonTransport],
    );

    useEffect(() => {
        if (!!addr) {
            navigation.goBack();
            navigation.navigateLedgerApp();
        }
    }, [addr]);

    return (
        <View style={{
            flex: 1,
        }}>
            <Text style={{
                fontWeight: '600',
                fontSize: 18,
                color: Theme.textColor,
                marginBottom: 16,
                textAlign: 'center',
                marginHorizontal: 16
            }}>
                {t('hardwareWallet.chooseAccountDescription')}
            </Text>
            <ScrollView
                contentInset={{ top: 0, bottom: safeArea.bottom + 16 }}
                contentOffset={{ y: 16 + safeArea.top, x: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {loading && (<LoadingIndicator simple />)}
                {accounts.map((acc) => <AccountButton key={acc.i} loadingAcc={selected} onSelect={onLoadAccount} acc={acc} />)}
                <View style={{ height: 56 }} />
            </ScrollView>
        </View>
    );
});