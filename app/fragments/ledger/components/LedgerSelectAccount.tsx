import BN from "bn.js";
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../../AppConfig";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { RoundButton } from "../../../components/RoundButton";
import { WalletAddress } from "../../../components/WalletAddress";
import { useEngine } from "../../../engine/Engine";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { AccountButton } from "./AccountButton";

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: BN };

export const LedgerSelectAccount = React.memo(({
    device,
    reset
}: {
    device: TonTransport,
    reset: () => void
}) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number>();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);

    useEffect(() => {
        (async () => {
            const proms: Promise<LedgerAccount>[] = [];
            const seqno = (await engine.client4.getLastBlock()).last.seqno;
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i);
                    const addr = await device.getAddress(path, { testOnly: AppConfig.isTestnet });
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
    }, []);

    const onLoadAccount = React.useCallback(
        (async (acc: LedgerAccount) => {
            if (!device) {
                Alert.alert(t('hardwareWallet.errors.noDevice'));
                reset();
                return;
            }
            setSelected(acc.i);
            let path = pathFromAccountNumber(acc.i);
            try {
                await device.validateAddress(path, { testOnly: AppConfig.isTestnet });
                navigation.navigateLedgerApp({ account: acc.i, address: acc.addr, device });
            } catch (e) {
                console.warn(e);
                reset();
                setSelected(undefined);
            }
        }),
        [device],
    );

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