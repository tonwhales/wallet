import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, StyleProp, ViewStyle, Insets, PointProp, Platform, Share } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { ThemeType } from "../../../engine/state/theme";
import { Jetton } from '../../../engine/types';
import { AddressContact } from "../../../engine/hooks/contacts/useAddressBook";
import { useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePendingTransactions, useServerConfig, useSpamMinAmount, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { AppState } from "../../../storage/appState";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { confirmAlert } from "../../../utils/confirmAlert";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { warn } from "../../../utils/log";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { JettonTransfer } from "../../../engine/hooks/transactions/useJettonTransactions";
import { JettonTransactionView } from "./JettonTransactionView";
import { SectionHeader } from "./WalletTransactions";

type TransactionListItemProps = {
    address: Address,
    theme: ThemeType,
    onPress: (tx: JettonTransfer) => void,
    onLongPress?: (tx: JettonTransfer) => void,
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
    knownWallets: { [key: string]: KnownWallet },
    jetton: Jetton
}

const JettonTransactionListItem = memo(({ item, section, index, theme, ...props }: SectionListRenderItemInfo<JettonTransfer, { title: string }> & TransactionListItemProps) => {
    return (
        <JettonTransactionView
            own={props.address}
            tx={item}
            separator={section.data[index + 1] !== undefined}
            theme={theme}
            ledger={props.ledger}
            {...props}
        />
    );
}, (prev, next) => {
    return prev.item.trace_id === next.item.trace_id
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
JettonTransactionListItem.displayName = 'TransactionListItem';

export const JettonWalletTransactions = memo((props: {
    txs: JettonTransfer[],
    hasNext: boolean,
    address: Address,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    onLoadMore: () => void,
    loading: boolean,
    header?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    sectionedListProps?: {
        contentContainerStyle?: StyleProp<ViewStyle>,
        contentInset?: Insets,
        contentOffset?: PointProp
    },
    ledger?: boolean,
    theme: ThemeType,
    jetton: Jetton
}) => {
    const theme = props.theme;
    const navigation = props.navigation;
    const bottomBarHeight = useBottomTabBarHeight();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const addressBookContext = useAddressBookContext();
    const addressBook = addressBookContext.state;
    const addToDenyList = useAddToDenyList();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const appState = useAppState();
    const [spamMinAmount] = useSpamMinAmount();
    const [dontShowComments] = useDontShowComments();
    const [pending] = usePendingTransactions(props.address, isTestnet);
    const [bounceableFormat] = useBounceableWalletFormat();
    const [walletsSettings] = useWalletsSettings();
    
    const ref = useRef<SectionList<JettonTransfer, { title: string }>>(null);

    const { showActionSheetWithOptions } = useActionSheet();

    const { transactionsSectioned } = useMemo(() => {
        const sectioned = new Map<string, { title: string, data: JettonTransfer[] }>();
        for (let i = 0; i < props.txs.length; i++) {
            const t = props.txs[i];
            const time = getDateKey(t.transaction_now);
            const section = sectioned.get(time);
            if (section) {
                section.data.push(t);
            } else {
                sectioned.set(time, { title: formatDate(t.transaction_now), data: [t] });
            }
        }
        return { transactionsSectioned: Array.from(sectioned.values()) };
    }, [props.txs]);

    const navigateToPreview = useCallback((transaction: JettonTransfer) => {
        props.navigation.navigate(
            props.ledger ? 'LedgerJettonTransactionPreview' : 'JettonTransaction',
            { transaction }
        );
    }, [props.ledger, props.navigation]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<JettonTransfer, { title: string }> }) => (
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

    const onRepeatTx = useCallback((tx: JettonTransfer) => {
        // TODO
        // const amount = BigInt(tx.base.parsed.amount);
        // const operation = tx.base.operation;
        // const item = operation.items[0];
        // const opAddressString = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        // const opAddr = Address.parseFriendly(opAddressString);
        // const bounceable = bounceableFormat ? true : opAddr.isBounceable;
        // const target = opAddr.address.toString({ testOnly: isTestnet, bounceable });
        // const jetton = item.kind === 'token' ? tx.metadata?.jettonWallet?.master : null;
        // navigation.navigateSimpleTransfer({
        //     target,
        //     comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
        //     amount: amount < 0n ? -amount : amount,
        //     job: null,
        //     stateInit: null,
        //     jetton: jetton,
        //     callback: null
        // });
    }, [navigation, isTestnet, bounceableFormat]);

    const onLongPress = (tx: JettonTransfer) => {
        // TODO
        // const operation = tx.base.operation;
        // const item = operation.items[0];
        // const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        // const kind = tx.base.parsed.kind;
        // const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${opAddress}`;
        // const txId = `${tx.base.lt}_${tx.base.hash}`;
        // const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
        //     + `${props.address.toString({ testOnly: isTestnet })}/`
        //     + `${txId}`;
        // const itemAmount = BigInt(item.amount);
        // const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
        // const contact = addressBook.contacts[opAddress];
        // const isSpam = !!addressBook.denyList[opAddress]?.reason;

        // const spam =
        //     !!spamWallets.find((i) => opAddress === i)
        //     || isSpam
        //     || (
        //         absAmount < spamMinAmount
        //         && !!tx.base.operation.comment
        //         && !knownWallets[opAddress]
        //         && !isTestnet
        //     ) && kind !== 'out';

        // const canRepeat = kind === 'out'
        //     && !props.ledger
        //     && tx.base.parsed.body?.type !== 'payload';

        // const handleAction = (eN?: number) => {
        //     switch (eN) {
        //         case 1: {
        //             if (explorerTxLink) {
        //                 onShare(explorerTxLink, t('txActions.share.transaction'));
        //             }
        //             break;
        //         }
        //         case 2: {
        //             onAddressContact(Address.parse(opAddress));
        //             break;
        //         }
        //         case 3: {
        //             onShare(addressLink, t('txActions.share.address'));
        //             break;
        //         }
        //         case 4: {
        //             if (!spam) {
        //                 onMarkAddressSpam(opAddress);
        //             } else if (canRepeat) {
        //                 onRepeatTx(tx);
        //             }
        //             break;
        //         }
        //         case 5: {
        //             if (canRepeat) {
        //                 onRepeatTx(tx);
        //             }
        //             break;
        //         }
        //         default:
        //             break;
        //     }
        // }

        // const actionSheetOptions: ActionSheetOptions = {
        //     options: tx.base.outMessagesCount > 1 ? [
        //         t('common.cancel'),
        //         t('txActions.txShare'),
        //     ] : [
        //         t('common.cancel'),
        //         t('txActions.txShare'),
        //         !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'),
        //         t('txActions.addressShare'),
        //         ...(!spam ? [t('txActions.addressMarkSpam')] : []),
        //         ...(canRepeat ? [t('txActions.txRepeat')] : []),
        //     ],
        //     userInterfaceStyle: theme.style,
        //     cancelButtonIndex: 0,
        //     destructiveButtonIndex: !spam ? 4 : undefined,
        // }

        // return showActionSheetWithOptions(actionSheetOptions, handleAction);
    }

    useEffect(() => {
        // Scroll to top when new pending transactions appear
        if (pending.length > 0) {
            ref.current?.scrollToLocation({ sectionIndex: -1, itemIndex: 0, animated: true });
        }
    }, [pending.length]);

    return (
        <SectionList
            ref={ref}
            style={{ flexGrow: 1 }}
            contentContainerStyle={[
                props.sectionedListProps?.contentContainerStyle
            ]}
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
            renderItem={(item) => (
                <JettonTransactionListItem
                    {...item}
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
                    jetton={props.jetton}
                />
            )}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.trace_id}
        />
    );
});
JettonWalletTransactions.displayName = 'JettonWalletTransactions';