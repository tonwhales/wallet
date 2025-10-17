import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { SectionList, SectionListData, SectionListRenderItemInfo, View } from "react-native";
import { TonTransaction } from '../../../engine/types';
import { useAddressFormatsHistory, useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, useServerConfig, useSpamMinAmount, useTheme, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { t } from "../../../i18n/t";
import { confirmAlert } from "../../../utils/confirmAlert";
import { useKnownWallets } from "../../../secure/KnownWallets";
import { warn } from "../../../utils/log";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { TransactionsSectionHeader } from "./TransactionsSectionHeader";
import { useUnifiedTransactions, useSectionedTransactions, useRepeatTonTransaction, useTonTransactionActions } from "../../../engine/hooks/transactions";
import { UnifiedTransactionView } from "./UnifiedTransactionView";
import { UnifiedTonTransaction } from "../../../engine/types/unifiedTransaction";
import { TransactionsListFooter } from "../../../components/transactions/TransactionsListFooter";

export const WalletTransactions = memo((props: {
    address: Address,
    header?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ledger?: boolean,
    isWalletTab?: boolean
}) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const { getAddressFormat } = useAddressFormatsHistory();
    const {
        transactions,
        pendingCount,
        loading,
        refreshing,
        hasNext,
        next,
        refresh,
        markAsSent,
        markAsTimedOut
    } = useUnifiedTransactions(props.address, isTestnet);

    const onLoadMore = useCallback(() => {
        next();
    }, [next]);

    const onRefresh = useCallback(() => {
        refresh();
    }, [refresh]);

    const bottomBarHeight = useBottomTabBarHeight();
    const knownWallets = useKnownWallets(isTestnet);
    const [spamMinAmount] = useSpamMinAmount();
    const [dontShowComments] = useDontShowComments();
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const addToDenyList = useAddToDenyList();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const appState = useAppState();
    const ref = useRef<SectionList<any, { title: string }>>(null);
    const [bounceableFormat] = useBounceableWalletFormat();
    const [walletsSettings] = useWalletsSettings();

    const transactionsSectioned = useSectionedTransactions(transactions);

    const navigateToPreview = useCallback((transaction: TonTransaction) => {
        navigation.navigateTonTransaction(transaction, props.ledger);
    }, [navigation, props.ledger]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<any, { title: string }> }) => (
        <TransactionsSectionHeader theme={theme} title={section.section.title} />
    ), [theme]);

    const onMarkAddressSpam = useCallback(async (address: string) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            addToDenyList(address, 'spam');
        }
    }, [addToDenyList]);

    const onAddressContact = useCallback((address: string) => {
        navigation.navigate('Contact', { address });
    }, []);

    const onRepeatTx = useRepeatTonTransaction();

    const onLongPress = useTonTransactionActions({
        address: props.address,
        theme,
        ledger: props.ledger,
        onMarkAddressSpam,
        onAddressContact,
        onRepeatTx
    });

    useEffect(() => {
        // Scroll to top when new pending transactions appear
        if (pendingCount > 0) {
            ref.current?.scrollToLocation({ sectionIndex: -1, itemIndex: 0, animated: true });
        }
    }, [pendingCount]);

    const renderItem = useCallback((tx: SectionListRenderItemInfo<UnifiedTonTransaction, { title: string }>) => {
        return (
            <UnifiedTransactionView
                {...tx}
                address={props.address}
                theme={theme}
                onPress={navigateToPreview}
                onLongPress={onLongPress}
                ledger={props.ledger}
                spamMinAmount={spamMinAmount}
                dontShowComments={dontShowComments}
                denyList={addressBook.denyList}
                contacts={addressBook.contacts}
                isTestnet={isTestnet}
                spamWallets={spamWallets}
                appState={appState}
                bounceableFormat={bounceableFormat}
                walletsSettings={walletsSettings}
                knownWallets={knownWallets}
                getAddressFormat={getAddressFormat}
                markAsSent={markAsSent}
                markAsTimedOut={markAsTimedOut}
            />
        );
    }, [
        props.address,
        theme,
        navigateToPreview,
        onLongPress,
        props.ledger,
        spamMinAmount,
        dontShowComments,
        addressBook.denyList,
        addressBook.contacts,
        isTestnet,
        spamWallets,
        appState,
        bounceableFormat,
        walletsSettings,
        knownWallets,
        markAsSent,
        markAsTimedOut,
    ]);

    const listEmptyComponent = useMemo(() => (
        loading
            ? <TransactionsSkeleton />
            : <TransactionsEmptyState
                type={TransactionsEmptyStateType.Ton}
                isWalletTab={props.isWalletTab}
            />
    ), [loading, props.isWalletTab]);

    const list = useMemo(() => {
        return (
            <SectionList
                ref={ref}
                style={{ flexGrow: 1, flex: 1 }}
                contentContainerStyle={{
                    paddingBottom: 32
                }}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                sections={transactionsSectioned}
                scrollEventThrottle={50}
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
                onScrollToIndexFailed={() => {
                    warn('Failed to scroll to index');
                }}
                getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
                renderSectionHeader={renderSectionHeader}
                ListHeaderComponent={props.header}
                ListFooterComponent={<TransactionsListFooter hasNext={hasNext} theme={theme} />}
                ListEmptyComponent={listEmptyComponent}
                renderItem={renderItem}
                initialNumToRender={16}
                onEndReached={onLoadMore}
                maxToRenderPerBatch={16}
                onEndReachedThreshold={0.2}
                keyExtractor={(item) => 'tx-' + item.id}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
        )
    }, [
        transactionsSectioned,
        pendingCount,
        refreshing,
        bottomBarHeight,
        props.header,
        hasNext,
        theme,
        renderSectionHeader,
        renderItem,
        onRefresh,
        transactions.length === 0 ? listEmptyComponent : null
    ]);

    return list
});
WalletTransactions.displayName = 'WalletTransactions';