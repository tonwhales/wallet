import React, { Suspense, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useHoldersAccountStatus, useTheme } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { WalletTransactions } from "./views/WalletTransactions";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { TabHeader } from "../../components/topbar/TabHeader";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address } from "@ton/core";
import { TransactionsSkeleton } from "../../components/skeletons/TransactionsSkeleton";
import { setStatusBarStyle } from "expo-status-bar";
import { ThemeType } from "../../engine/state/theme";
import { useAccountTransactionsV2 } from "../../engine/hooks/transactions/useAccountTransactionsV2";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { useTransactionsFilter } from "../../engine/hooks/transactions/useTransactionsFilter";
import { TransactionsHeader } from "./views/TransactionsHeader";

function TransactionsComponent(props: { account: Address, isLedger?: boolean, theme: ThemeType }) {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const address = props.account;
    const theme = props.theme;
    const [params] = useTransactionsFilter(address);
    const txs = useAccountTransactionsV2(address.toString({ testOnly: isTestnet }), { refetchOnMount: true }, params);
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const showFilters = !!holdersAccStatus && holdersAccStatus.state === HoldersUserState.Ok && !!holdersAccStatus.token;
    const transactions = txs.data;

    const onReachedEnd = useCallback(() => {
        if (txs.hasNext) {
            txs.next();
        }
    }, [txs.next, txs.hasNext]);

    const onRefresh = useCallback(() => {
        if (!txs.loading) {
            txs.refresh();
        }
    }, [txs.refresh, txs.loading]);

    return (
        <View style={{ flex: 1, backgroundColor: props.theme.backgroundPrimary }}>
            <TabHeader title={t('transactions.history')} />
            <WalletTransactions
                txs={transactions ?? []}
                address={address}
                navigation={navigation}
                safeArea={safeArea}
                onLoadMore={onReachedEnd}
                hasNext={txs.hasNext === true}
                loading={txs.loading}
                ledger={props.isLedger}
                theme={theme}
                header={<TransactionsHeader showFilters={showFilters} address={address} />}
                refresh={{
                    onRefresh,
                    refreshing: txs.refreshing
                }}
                holdersAccStatus={holdersAccStatus}
                isWalletTab={true}
            />
        </View>
    );
}

export const TransactionsFragment = fragment(() => {
    const theme = useTheme();
    const route = useRoute();
    const isLedger = route.name === 'LedgerTransactions';
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();

    const account = useMemo(() => {
        if (isLedger) {
            if (!ledgerContext?.addr) {
                return undefined;
            }
            try {
                return Address.parse(ledgerContext.addr.address);
            } catch {

            }
        } else {
            return selected?.address;
        }
    }, [selected, ledgerContext?.addr]);

    useFocusEffect(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    });

    if (!account) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
                <TabHeader title={t('transactions.history')} />
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingIndicator />
                </View>
            </View>
        );
    } else {
        return (
            <Suspense fallback={
                <View style={{ paddingTop: 166 }}>
                    <TransactionsSkeleton />
                </View>
            }>
                <TransactionsComponent
                    theme={theme}
                    isLedger={isLedger}
                    account={account}
                />
            </Suspense>
        )
    }
});