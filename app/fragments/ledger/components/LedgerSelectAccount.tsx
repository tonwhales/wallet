import BN from "bn.js";
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { t } from "../../../i18n/t";
import { warn } from "../../../utils/log";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { AccountButton } from "./AccountButton";
import { useTransport } from "./TransportContext";
import { useTheme } from '../../../engine/hooks';
import { useClient4 } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';

export type LedgerAccount = { i: number, addr: { address: string, publicKey: Buffer }, balance: bigint };

export const LedgerSelectAccount = React.memo(({ onReset }: { onReset: () => void }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { tonTransport, setAddr, addr } = useTransport();
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number>();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const client = useClient4(isTestnet);

    useEffect(() => {
        (async () => {
            if (!tonTransport) {
                return;
            }
            const proms: Promise<LedgerAccount>[] = [];
            const seqno = (await client.getLastBlock()).last.seqno;
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i, isTestnet);
                    const addr = await tonTransport.getAddress(path, { testOnly: isTestnet });
                    try {
                        const address = Address.parse(addr.address);
                        const liteAcc = await client.getAccountLite(seqno, address);
                        return { i, addr, balance: BigInt(liteAcc.account.balance.coins) };
                    } catch (error) {
                        return { i, addr, balance: BigInt(0) };
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
            let path = pathFromAccountNumber(acc.i, isTestnet);
            try {
                await tonTransport.validateAddress(path, { testOnly: isTestnet });
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
                color: theme.textColor,
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