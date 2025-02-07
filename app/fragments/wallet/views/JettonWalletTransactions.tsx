import React, { memo, useCallback, useMemo, useRef } from "react";
import { Address, toNano } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, StyleProp, ViewStyle, Insets, PointProp, Platform, Share } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { ThemeType } from "../../../engine/state/theme";
import { Jetton } from '../../../engine/types';
import { AddressContact } from "../../../engine/hooks/contacts/useAddressBook";
import { useAddToDenyList, useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, useServerConfig, useSpamMinAmount, useWalletsSettings } from "../../../engine/hooks";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { AppState } from "../../../storage/appState";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";
import { confirmAlert } from "../../../utils/confirmAlert";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { warn } from "../../../utils/log";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { useAddressBookContext } from "../../../engine/AddressBookContext";
import { JettonTransfer } from "../../../engine/hooks/transactions/useJettonTransactions";
import { JettonTransactionView } from "./JettonTransactionView";
import { parseForwardPayloadComment } from "../../../utils/spam/isTxSPAM";
import { t } from "../../../i18n/t";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { useGaslessConfig } from "../../../engine/hooks/jettons/useGaslessConfig";
import { TransactionsSectionHeader } from "./TransactionsSectionHeader";

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
JettonTransactionListItem.displayName = 'JettonTransactionListItem';

export const JettonWalletTransactions = memo((props: {
    txs: JettonTransfer[],
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
    jetton: Jetton
}) => {
    const {theme, navigation, address, ledger, jetton, txs, header, loading, hasNext, sectionedListProps, onLoadMore, onRefresh } = props;
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
    const [bounceableFormat] = useBounceableWalletFormat();
    const [walletsSettings] = useWalletsSettings();
    const gaslessConfig = useGaslessConfig().data;

    const ref = useRef<SectionList<JettonTransfer, { title: string }>>(null);

    const { showActionSheetWithOptions } = useActionSheet();

    const { transactionsSectioned } = useMemo(() => {
        const sectioned = new Map<string, { title: string, data: JettonTransfer[] }>();
        for (let i = 0; i < props.txs.length; i++) {
            const t = txs[i];

            if (gaslessConfig?.relay_address && Address.parse(gaslessConfig.relay_address).equals(Address.parse(t.destination))) {
                continue;
            }

            const time = getDateKey(t.transaction_now);
            const section = sectioned.get(time);
            if (section) {
                section.data.push(t);
            } else {
                sectioned.set(time, { title: formatDate(t.transaction_now), data: [t] });
            }
        }
        return { transactionsSectioned: Array.from(sectioned.values()) };
    }, [txs, gaslessConfig?.relay_address]);

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

    const renderSectionHeader = (section: { section: SectionListData<JettonTransfer, { title: string }> }) => (
        <TransactionsSectionHeader theme={theme} title={section.section.title} />
    );

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
        const decimals = props.jetton.decimals ?? 9;
        const amount = toNano(fromBnWithDecimals(BigInt(tx.amount), decimals));
        const opAddr = Address.parse(tx.destination);
        const bounceable = bounceableFormat;
        const target = opAddr.toString({ testOnly: isTestnet, bounceable });
        const comment = parseForwardPayloadComment(tx.forward_payload);

        navigation.navigateSimpleTransfer({
            target,
            comment: comment,
            amount: amount < 0n ? -amount : amount,
            stateInit: null,
            jetton: jetton.wallet,
            callback: null
        });
    }, [navigation, isTestnet, bounceableFormat, jetton]);

    const onLongPress = (tx: JettonTransfer) => {
        const targetAddress = Address.parse(tx.destination);
        const targetAddressWithBounce = targetAddress.toString({ testOnly: isTestnet, bounceable: bounceableFormat });
        const target = targetAddress.toString({ testOnly: isTestnet });
        const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${targetAddressWithBounce}`;
        const buffTxHash = Buffer.from(tx.trace_id, 'base64');
        const txHash = buffTxHash.toString('base64');
        const explorerTxLink = `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${props.address.toString({ testOnly: isTestnet })}/`
            + `${tx.transaction_lt}_${encodeURIComponent(txHash)}`;
        const contact = addressBook.contacts[target];
        const isSpam = !!addressBook.denyList[target]?.reason;
        const kind: 'in' | 'out' = targetAddress.equals(address) ? 'in' : 'out';
        const comment = parseForwardPayloadComment(tx.forward_payload);

        const spam =
            !!spamWallets.find((i) => target === i)
            || isSpam
            || !!comment && !knownWallets[target] && !isTestnet && kind === 'in';

        const canRepeat = kind === 'out'
            && !ledger
            && !tx.custom_payload
            && !(!!tx.forward_payload && !comment);

        const handleAction = (eN?: number) => {
            switch (eN) {
                case 1: {
                    if (explorerTxLink) {
                        onShare(explorerTxLink, t('txActions.share.transaction'));
                    }
                    break;
                }
                case 2: {
                    onAddressContact(targetAddress);
                    break;
                }
                case 3: {
                    onShare(addressLink, t('txActions.share.address'));
                    break;
                }
                case 4: {
                    if (!spam) {
                        onMarkAddressSpam(target);
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
            options: [
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

    return (
        <SectionList
            ref={ref}
            style={{ flexGrow: 1 }}
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
            ListEmptyComponent={loading ? <TransactionsSkeleton /> : <TransactionsEmptyState isLedger={props.ledger} />}
            renderItem={(item) => (
                <JettonTransactionListItem
                    {...item}
                    address={address}
                    theme={theme}
                    onPress={navigateToPreview}
                    onLongPress={onLongPress}
                    ledger={ledger}
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
            onRefresh={onRefresh}
            refreshing={loading}
            onEndReached={onLoadMore}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.trace_id + item.transaction_lt}
        />
    );
});
JettonWalletTransactions.displayName = 'JettonWalletTransactions';