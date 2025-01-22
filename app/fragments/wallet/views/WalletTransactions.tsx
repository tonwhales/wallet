import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, Text, StyleProp, ViewStyle, Insets, PointProp, Platform, Share } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TransactionView } from "./TransactionView";
import { ThemeType } from "../../../engine/state/theme";
import { HoldersTransaction, TransactionDescription, TransactionType } from '../../../engine/types';
import { AddressContact } from "../../../engine/hooks/contacts/useAddressBook";
import { useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePendingTransactions, useServerConfig, useSpamMinAmount, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { AppState } from "../../../storage/appState";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";
import { t } from "../../../i18n/t";
import { confirmAlert } from "../../../utils/confirmAlert";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { Typography } from "../../../components/styles";
import { warn } from "../../../utils/log";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { queryClient } from "../../../engine/clients";
import { getQueryData } from "../../../engine/utils/getQueryData";
import { Queries } from "../../../engine/queries";
import { StoredJettonWallet } from "../../../engine/metadata/StoredMetadata";
import { jettonWalletQueryFn } from "../../../engine/hooks/jettons/jettonsBatcher";
import { AccountTonTransaction, AccountTransaction } from "../../../engine/hooks/transactions/useAccountTransactionsV2";

export const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                {title}
            </Text>
        </View>
    )
});
SectionHeader.displayName = 'SectionHeader';

type TransactionListItemProps = {
    address: Address,
    theme: ThemeType,
    onPress: (tx: TransactionDescription) => void,
    onLongPress?: (tx: TransactionDescription) => void,
    ledger?: boolean,
    navigation: TypedNavigation,
    addToDenyList: (address: string | Address, reason: string) => void,
    spamMinAmount: bigint,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    spamWallets: string[],
    appState: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings }
    knownWallets: { [key: string]: KnownWallet }
}

const TransactionListItem = memo(({ item, section, index, theme, ...props }: SectionListRenderItemInfo<AccountTonTransaction, { title: string }> & TransactionListItemProps) => {
    return (
        <TransactionView
            own={props.address}
            tx={item}
            separator={section.data[index + 1] !== undefined}
            theme={theme}
            ledger={props.ledger}
            {...props}
        />
    );
}, (prev, next) => {
    return prev.item.id === next.item.id
        && prev.isTestnet === next.isTestnet
        && prev.dontShowComments === next.dontShowComments
        && prev.spamMinAmount === next.spamMinAmount
        && prev.address === next.address
        && prev.theme === next.theme
        && prev.section === next.section
        && prev.index === next.index
        && prev.addToDenyList === next.addToDenyList
        && prev.denyList === next.denyList
        && prev.contacts === next.contacts
        && prev.spamWallets === next.spamWallets
        && prev.appState === next.appState
        && prev.onLongPress === next.onLongPress
        && prev.bounceableFormat === next.bounceableFormat
        && prev.walletsSettings === next.walletsSettings
        && prev.knownWallets === next.knownWallets
});
TransactionListItem.displayName = 'TransactionListItem';

export const WalletTransactions = memo((props: {
    txs: AccountTransaction[],
    hasNext: boolean,
    address: Address,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    onLoadMore: () => void,
    loading: boolean,
    refresh?: {
        onRefresh: () => void,
        refreshing: boolean
    }
    header?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    sectionedListProps?: {
        contentContainerStyle?: StyleProp<ViewStyle>,
        contentInset?: Insets,
        contentOffset?: PointProp
    },
    ledger?: boolean,
    theme: ThemeType,
}) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const theme = props.theme;
    const navigation = props.navigation;
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const [spamMinAmount] = useSpamMinAmount();
    const [dontShowComments] = useDontShowComments();
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const addToDenyList = useAddToDenyList();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const appState = useAppState();
    const [pending] = usePendingTransactions(props.address, isTestnet);
    const ref = useRef<SectionList<any, { title: string }>>(null);
    const [bounceableFormat] = useBounceableWalletFormat();
    const [walletsSettings] = useWalletsSettings();

    const { showActionSheetWithOptions } = useActionSheet();

    const { transactionsSectioned } = useMemo(() => {
        const sectioned = new Map<string, { title: string, data: AccountTransaction[] }>();
        for (let i = 0; i < props.txs.length; i++) {
            const tx = props.txs[i];
            const time = (tx.type === TransactionType.TON ? tx.data.base.time : tx.data.time) / 1000;
            const timeKey = getDateKey(time);
            const section = sectioned.get(timeKey);
            if (section) {
                section.data.push(tx);
            } else {
                sectioned.set(timeKey, { title: formatDate(time), data: [tx] });
            }
        }
        return { transactionsSectioned: Array.from(sectioned.values()) };
    }, [props.txs]);

    const navigateToPreview = useCallback((transaction: TransactionDescription) => {
        props.navigation.navigate(
            props.ledger ? 'LedgerTransactionPreview' : 'Transaction',
            { transaction }
        );
    }, [props.ledger, props.navigation]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<any, { title: string }> }) => (
        <SectionHeader theme={theme} title={section.section.title} />
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

    const onAddressContact = useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toString({ testOnly: isTestnet }) });
    }, []);

    const onRepeatTx = useCallback(async (tx: TransactionDescription) => {
        const amount = BigInt(tx.base.parsed.amount);
        const operation = tx.base.operation;
        const item = operation.items[0];
        const opAddressString = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const opAddr = Address.parseFriendly(opAddressString);
        const bounceable = bounceableFormat ? true : opAddr.isBounceable;
        const target = opAddr.address.toString({ testOnly: isTestnet, bounceable });

        let jetton = null;

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
        }

        navigation.navigateSimpleTransfer({
            target,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: amount < 0n ? -amount : amount,
            stateInit: null,
            jetton: jetton,
            callback: null
        });
    }, [navigation, isTestnet, bounceableFormat]);

    const onLongPress = (tx: TransactionDescription) => {
        const operation = tx.base.operation;
        const item = operation.items[0];
        const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const kind = tx.base.parsed.kind;
        const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${opAddress}`;
        const txId = `${tx.base.lt}_${tx.base.hash}`;
        const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${props.address.toString({ testOnly: isTestnet })}/`
            + `${txId}`;
        const itemAmount = BigInt(item.amount);
        const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
        const contact = addressBook.contacts[opAddress];
        const isSpam = !!addressBook.denyList[opAddress]?.reason;

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
            && tx.base.parsed.body?.type !== 'payload';

        const handleAction = (eN?: number) => {
            switch (eN) {
                case 1: {
                    if (explorerTxLink) {
                        onShare(explorerTxLink, t('txActions.share.transaction'));
                    }
                    break;
                }
                case 2: {
                    onAddressContact(Address.parse(opAddress));
                    break;
                }
                case 3: {
                    onShare(addressLink, t('txActions.share.address'));
                    break;
                }
                case 4: {
                    if (!spam) {
                        onMarkAddressSpam(opAddress);
                    } else if (canRepeat) {
                        onRepeatTx(tx);
                    }
                    break;
                }
                case 5: {
                    if (canRepeat) {
                        onRepeatTx(tx);
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
    }

    useEffect(() => {
        // Scroll to top when new pending transactions appear
        if (pending.length > 0) {
            ref.current?.scrollToLocation({ sectionIndex: -1, itemIndex: 0, animated: true });
        }
    }, [pending.length]);

    const renderItem = useCallback((tx: SectionListRenderItemInfo<AccountTransaction, { title: string }>) => {

        if (tx.item.type === TransactionType.HOLDERS) {
            return (
                <View style={{ flexDirection: 'row' }}>
                    <Text>{'Holders'}</Text>
                    <Text>{getDateKey(tx.item.data.time)}</Text>
                </View>
            )
        }

        return <TransactionListItem
            {...tx as any}
            address={props.address}
            theme={theme}
            onPress={navigateToPreview}
            onLongPress={onLongPress}
            ledger={props.ledger}
            navigation={navigation}
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
            addToDenyList={addToDenyList}
        />
    }, [props.address, theme, navigateToPreview, onLongPress, props.ledger, spamMinAmount, dontShowComments, addressBook.denyList, addressBook.contacts, isTestnet, spamWallets, appState, bounceableFormat, walletsSettings, knownWallets]);

    return (
        <SectionList
            ref={ref}
            style={{ flexGrow: 1 }}
            contentContainerStyle={[
                props.sectionedListProps?.contentContainerStyle
            ]}
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
            ListFooterComponent={props.hasNext ? (
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
            ListEmptyComponent={props.loading ? <TransactionsSkeleton /> : <TransactionsEmptyState isLedger={props.ledger} />}
            renderItem={renderItem}
            initialNumToRender={16}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={0.2}
            keyExtractor={(item) => 'tx-' + item.data.id}
            onRefresh={props.refresh?.onRefresh}
            refreshing={props.refresh?.refreshing}
        />
    );
});
WalletTransactions.displayName = 'WalletTransactions';