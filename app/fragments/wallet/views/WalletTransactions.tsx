import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, Platform, Share } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TonTransaction } from '../../../engine/types';
import { useAddressFormatsHistory, useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePendingTransactions, useServerConfig, useSpamMinAmount, useTheme, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState, TransactionsEmptyStateType } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";
import { t } from "../../../i18n/t";
import { confirmAlert } from "../../../utils/confirmAlert";
import { useKnownWallets } from "../../../secure/KnownWallets";
import { warn } from "../../../utils/log";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { queryClient } from "../../../engine/clients";
import { getQueryData } from "../../../engine/utils/getQueryData";
import { Queries } from "../../../engine/queries";
import { StoredJettonWallet } from "../../../engine/metadata/StoredMetadata";
import { jettonWalletQueryFn } from "../../../engine/hooks/jettons/jettonsBatcher";
import { TransactionsSectionHeader } from "./TransactionsSectionHeader";
import { useUnifiedTransactions } from "../../../engine/hooks/transactions/useUnifiedTransactions";
import { UnifiedTransactionView } from "./UnifiedTransactionView";
import { UnifiedTonTransaction } from "../../../engine/types/unifiedTransaction";

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

    const { showActionSheetWithOptions } = useActionSheet();

    const { transactionsSectioned } = useMemo(() => {
        const sectioned = new Map<string, { title: string, data: UnifiedTonTransaction[] }>();
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            if (!tx?.time) continue;
            const time = tx.time;
            const timeKey = getDateKey(time);
            const section = sectioned.get(timeKey);
            if (section) {
                section.data.push(tx);
            } else {
                sectioned.set(timeKey, { title: formatDate(time), data: [tx] });
            }
        }
        return { transactionsSectioned: Array.from(sectioned.values()) };
    }, [transactions]);

    const navigateToPreview = useCallback((transaction: TonTransaction) => {
        navigation.navigateTonTransaction(transaction, props.ledger);
    }, [navigation, props.ledger]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<any, { title: string }> }) => (
        <TransactionsSectionHeader theme={theme} title={section.section.title} />
    ), [theme]);

    const onShare = useCallback((link: string, title: string) => {
        if (Platform.OS === 'ios') {
            Share.share({ title: title, url: link });
        } else {
            Share.share({ title: title, message: link });
        }
    }, []);

    const onMarkAddressSpam = useCallback(async (address: string) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            addToDenyList(address, 'spam');
        }
    }, [addToDenyList]);

    const onAddressContact = useCallback((address: string) => {
        navigation.navigate('Contact', { address });
    }, []);

    const onRepeatTx = useCallback(async (tx: TonTransaction, formattedAddressString: string) => {
        const amount = BigInt(tx.base.parsed.amount);
        const operation = tx.base.operation;
        let item = operation.items[0];
        let opAddressString = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;

        let jetton: Address | undefined = undefined;

        if (item.kind === 'token') {
            const queryCache = queryClient.getQueryCache();
            const jettonWallet = getQueryData<StoredJettonWallet | null | undefined>(
                queryCache,
                Queries.Account(opAddressString).JettonWallet()
            );

            if (jettonWallet) {
                jetton = Address.parse(jettonWallet.master);
            } else {
                try {
                    const res = await queryClient.fetchQuery({
                        queryKey: Queries.Account(opAddressString).JettonWallet(),
                        queryFn: jettonWalletQueryFn(opAddressString, isTestnet)
                    });

                    if (res) {
                        jetton = Address.parse(res.master);
                    }

                } catch {
                    warn('Failed to fetch jetton wallet');
                }
            }
            
            // If jettonWallet is not found (for example, swap on DEX), use TON from items[1]
            if (!jetton && operation.items.length > 1 && operation.items[1].kind === 'ton') {
                item = operation.items[1];
                opAddressString = tx.base.parsed.resolvedAddress;
            }
        }

        navigation.navigateSimpleTransfer({
            target: formattedAddressString,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: amount < 0n ? -amount : amount,
            stateInit: null,
            asset: { type: 'jetton', master: jetton },
            callback: null
        });
    }, [navigation, isTestnet, bounceableFormat]);

    const onLongPress = useCallback((tx: TonTransaction, formattedAddressString?: string) => {
        const operation = tx.base.operation;
        // If items[0] is a token but jettonDecimals is not set (for example, swap on DEX), use items[1] (TON)
        const item = operation.items[0].kind === 'token' && !tx.jettonDecimals && operation.items.length > 1
            ? operation.items[1]
            : operation.items[0];
        const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const opAddressFriendly = Address.parseFriendly(opAddress);
        const opAddressInAnotherFormat = opAddressFriendly.address.toString({ testOnly: isTestnet, bounceable: !opAddressFriendly.isBounceable });
        // Previously contacts could be created with different address formats, now it's only bounceable, but we need to check both formats to keep compatibility
        const contactAddress = addressBook.contacts[opAddress] ? opAddress : opAddressInAnotherFormat;
        const contact = addressBook.contacts[contactAddress];
        const isSpam = !!addressBook.denyList[contactAddress]?.reason;
        const kind = tx.base.parsed.kind;
        const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${formattedAddressString}`;
        const txId = `${tx.base.lt}_${tx.base.hash}`;
        const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${props.address.toString({ testOnly: isTestnet })}/`
            + `${txId}`;
        const itemAmount = BigInt(item.amount);
        const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;

        const spam =
            !!spamWallets.find((i) => opAddress === i)
            || isSpam
            || (
                absAmount < spamMinAmount
                && !!tx.base.operation.comment
                && !knownWallets[opAddress]
                && !isTestnet
            ) && kind !== 'out';

        const canRepeat = kind === 'out'
            && !props.ledger
            && tx.base.parsed.body?.type !== 'payload'
            && !!formattedAddressString;

        const handleAction = (eN?: number) => {
            switch (eN) {
                case 1: {
                    if (explorerTxLink) {
                        onShare(explorerTxLink, t('txActions.share.transaction'));
                    }
                    break;
                }
                case 2: {
                    onAddressContact(contactAddress);
                    break;
                }
                case 3: {
                    onShare(addressLink, t('txActions.share.address'));
                    break;
                }
                case 4: {
                    if (!spam) {
                        onMarkAddressSpam(contactAddress);
                    } else if (canRepeat) {
                        onRepeatTx(tx, formattedAddressString);
                    }
                    break;
                }
                case 5: {
                    if (canRepeat) {
                        onRepeatTx(tx, formattedAddressString);
                    }
                    break;
                }
                default:
                    break;
            }
        }

        const actionSheetOptions: ActionSheetOptions = {
            options: tx.base.outMessagesCount > 1 ? [
                t('common.cancel'),
                t('txActions.txShare'),
            ] : [
                t('common.cancel'),
                t('txActions.txShare'),
                !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'),
                t('txActions.addressShare'),
                ...(!spam ? [t('txActions.addressMarkSpam')] : []),
                ...(canRepeat ? [t('txActions.txRepeat')] : []),
            ],
            userInterfaceStyle: theme.style,
            cancelButtonIndex: 0,
            destructiveButtonIndex: !spam ? 4 : undefined,
        }

        return showActionSheetWithOptions(actionSheetOptions, handleAction);
    }, [addressBook, isTestnet, knownWallets, navigation, onAddressContact, onMarkAddressSpam, onRepeatTx, onShare, props.address, props.ledger, spamMinAmount, spamWallets, showActionSheetWithOptions, theme]);

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
                ListFooterComponent={hasNext ? (
                    <View style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <ReAnimatedCircularProgress
                            size={24}
                            color={theme.iconPrimary}
                            reverse
                            infinitRotate
                            progress={0.8}
                        />
                    </View>
                ) : null}
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