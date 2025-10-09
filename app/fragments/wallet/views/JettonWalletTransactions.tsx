import React, { memo, useCallback, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { SectionList, StyleProp, ViewStyle, Insets, PointProp } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { Jetton } from '../../../engine/types';
import { useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, useServerConfig, useSpamMinAmount, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { confirmAlert } from "../../../utils/confirmAlert";
import { useKnownWallets } from "../../../secure/KnownWallets";
import { warn } from "../../../utils/log";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { JettonTransfer } from "../../../engine/hooks/transactions/useJettonTransactions";
import { UnifiedJettonTransaction } from "../../../engine/types/unifiedTransaction";
import { UnifiedJettonTransactionView } from "./UnifiedJettonTransactionView";
import { useGaslessConfig } from "../../../engine/hooks/jettons/useGaslessConfig";
import { TransactionsSectionHeader } from "./TransactionsSectionHeader";
import { useAddressFormatsHistory } from "../../../engine/hooks";
import { useSectionedTransactions } from "../../../engine/hooks/transactions/useSectionedTransactions";
import { TransactionsListFooter } from "../../../components/transactions/TransactionsListFooter";
import { useRepeatJettonTransaction } from "../../../engine/hooks/transactions/useRepeatJettonTransaction";
import { useJettonTransactionActions } from "../../../engine/hooks/transactions/useJettonTransactionActions";

export const JettonWalletTransactions = memo((props: {
    txs: UnifiedJettonTransaction[],
    hasNext: boolean,
    address: Address,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    onLoadMore: () => void,
    onRefresh?: () => void,
    loading: boolean,
    header?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    sectionedListProps?: {
        contentContainerStyle?: StyleProp<ViewStyle>,
        contentInset?: Insets,
        contentOffset?: PointProp
    },
    ledger?: boolean,
    theme: ThemeType,
    jetton: Jetton,
    pendingCount?: number,
    markAsSent?: (id: string) => void,
    markAsTimedOut?: (id: string) => void
}) => {
    const { theme, navigation, address, ledger, jetton, txs, header, loading, hasNext, sectionedListProps, onLoadMore, onRefresh, markAsSent, markAsTimedOut } = props;
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();
    const knownWallets = useKnownWallets(isTestnet);
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const addToDenyList = useAddToDenyList();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const appState = useAppState();
    const [spamMinAmount] = useSpamMinAmount();
    const [dontShowComments] = useDontShowComments();
    const [bounceableFormat] = useBounceableWalletFormat();
    const { getAddressFormat } = useAddressFormatsHistory();
    const [walletsSettings] = useWalletsSettings();
    const gaslessConfig = useGaslessConfig().data;

    const ref = useRef<SectionList<UnifiedJettonTransaction, { title: string }>>(null);

    const filterFn = useCallback((unifiedTx: UnifiedJettonTransaction) => {
        // Skip gasless relay transactions for blockchain transactions
        if (unifiedTx.type === 'blockchain') {
            const t = unifiedTx.data as JettonTransfer;
            if (gaslessConfig?.relay_address && Address.parse(gaslessConfig.relay_address).equals(Address.parse(t.destination))) {
                return false;
            }
        }
        return true;
    }, [gaslessConfig?.relay_address]);

    const transactionsSectioned = useSectionedTransactions(txs, filterFn);

    const navigateToPreview = useCallback((transaction: JettonTransfer) => {
        if (ledger) {
            navigation.navigate('LedgerJettonTransactionPreview', {
                transaction,
                wallet: jetton.wallet.toString({ testOnly: isTestnet }),
                master: jetton.master.toString({ testOnly: isTestnet }),
                owner: address.toString({ testOnly: isTestnet })
            });
            return;
        }
        navigation.navigateJettonTransaction({
            transaction,
            wallet: jetton.wallet.toString({ testOnly: isTestnet }),
            master: jetton.master.toString({ testOnly: isTestnet }),
            owner: address.toString({ testOnly: isTestnet })
        });
    }, [ledger, address, jetton, isTestnet]);

    const renderSectionHeader = useCallback((section: { section: any }) => (
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
    }, [navigation]);

    const onRepeatTx = useRepeatJettonTransaction(jetton);

    const onLongPress = useJettonTransactionActions({
        address,
        theme,
        ledger,
        onMarkAddressSpam,
        onAddressContact,
        onRepeatTx
    });

    return (
        <SectionList
            ref={ref}
            style={{ flexGrow: 1, flex: 1 }}
            contentContainerStyle={sectionedListProps?.contentContainerStyle}
            contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
            sections={transactionsSectioned}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            stickySectionHeadersEnabled={false}
            initialNumToRender={15}
            onScrollToIndexFailed={() => {
                warn('Failed to scroll to index');
            }}
            getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={header}
            ListFooterComponent={<TransactionsListFooter hasNext={hasNext} theme={theme} />}
            ListEmptyComponent={loading
                ? <TransactionsSkeleton />
                : <TransactionsEmptyState
                    type={TransactionsEmptyStateType.Ton}
                    asset={{
                        content: {
                            icon: props.jetton.icon,
                            name: props.jetton.name
                        },
                        address: props.jetton.master
                    }}
                />
            }
            renderItem={(item) => (
                <UnifiedJettonTransactionView
                    {...item}
                    address={address}
                    theme={theme}
                    navigation={navigation}
                    onPress={navigateToPreview}
                    onLongPress={onLongPress}
                    ledger={ledger}
                    contacts={addressBook.contacts}
                    isTestnet={isTestnet}
                    appState={appState}
                    bounceableFormat={bounceableFormat}
                    walletsSettings={walletsSettings}
                    knownWallets={knownWallets}
                    dontShowComments={dontShowComments}
                    denyList={addressBook.denyList}
                    spamWallets={spamWallets}
                    spamMinAmount={spamMinAmount}
                    jetton={props.jetton}
                    addToDenyList={addToDenyList}
                    markAsSent={markAsSent}
                    markAsTimedOut={markAsTimedOut}
                />
            )}
            onRefresh={onRefresh}
            refreshing={loading}
            onEndReached={onLoadMore}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'jetton-tx-' + item.id}
        />
    );
});
JettonWalletTransactions.displayName = 'JettonWalletTransactions';