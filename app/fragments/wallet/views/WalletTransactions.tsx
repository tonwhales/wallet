import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, Text, StyleProp, ViewStyle, Insets, PointProp, Platform, Share } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TransactionView } from "./TransactionView";
import { ThemeType } from "../../../engine/state/theme";
import { Jetton, TransactionDescription } from '../../../engine/types';
import { AddressContact, useAddressBook } from "../../../engine/hooks/contacts/useAddressBook";
import { useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePendingTransactions, useServerConfig, useSpamMinAmount } from "../../../engine/hooks";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { AppState } from "../../../storage/appState";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";
import { t } from "../../../i18n/t";
import { confirmAlert } from "../../../utils/confirmAlert";
import { KnownWallets } from "../../../secure/KnownWallets";
import { Typography } from "../../../components/styles";
import { warn } from "../../../utils/log";

const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
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
    jettons: Jetton[],
    isTestnet: boolean,
    spamWallets: string[],
    appState: AppState,
    bounceableFormat: boolean,
}

const TransactionListItem = memo(({ item, section, index, theme, ...props }: SectionListRenderItemInfo<TransactionDescription, { title: string }> & TransactionListItemProps) => {
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
        && prev.jettons === next.jettons
        && prev.spamWallets === next.spamWallets
        && prev.appState === next.appState
        && prev.onLongPress === next.onLongPress
        && prev.bounceableFormat === next.bounceableFormat
});
TransactionListItem.displayName = 'TransactionListItem';

export const WalletTransactions = memo((props: {
    txs: TransactionDescription[],
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
    jettons: Jetton[]
}) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const theme = props.theme;
    const navigation = props.navigation;
    const { isTestnet } = useNetwork();
    const [spamMinAmount,] = useSpamMinAmount();
    const [dontShowComments,] = useDontShowComments();
    const [addressBook, updateAddressBook] = useAddressBook();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];
    const appState = useAppState();
    const [pending,] = usePendingTransactions(props.address, isTestnet);
    const ref = useRef<SectionList<TransactionDescription, { title: string }>>(null);
    const [bounceableFormat,] = useBounceableWalletFormat();

    const { showActionSheetWithOptions } = useActionSheet();

    const addToDenyList = useCallback((address: string | Address, reason: string = 'spam') => {
        let addr = '';

        if (address instanceof Address) {
            addr = address.toString({ testOnly: isTestnet });
        } else {
            addr = address;
        }

        return updateAddressBook((doc) => doc.denyList[addr] = { reason });
    }, [isTestnet, updateAddressBook]);

    const { transactionsSectioned } = useMemo(() => {
        const sectioned = new Map<string, TransactionDescription[]>();
        for (const t of props.txs) {
            const time = getDateKey(t.base.time);
            const section = sectioned.get(time);
            if (section) {
                section.push(t);
            } else {
                sectioned.set(time, [t]);
            }
        }
        const sections = Array.from(sectioned).map(([time, data]) => ({
            title: formatDate(data[0].base.time),
            data,
        }));
        return { transactionsSectioned: sections };
    }, [props.txs]);

    const navigateToPreview = useCallback((transaction: TransactionDescription) => {
        props.navigation.navigate(
            props.ledger ? 'LedgerTransactionPreview' : 'Transaction',
            { transaction }
        );
    }, [props.ledger, props.navigation]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<TransactionDescription, { title: string }> }) => (
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

    const onRepeatTx = useCallback((tx: TransactionDescription) => {
        const amount = BigInt(tx.base.parsed.amount);
        const operation = tx.base.operation;
        const item = operation.items[0];
        const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const jetton = item.kind === 'token' ? tx.metadata?.jettonWallet?.master : null;
        navigation.navigateSimpleTransfer({
            target: opAddress,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: amount < 0n ? -amount : amount,
            job: null,
            stateInit: null,
            jetton: jetton,
            callback: null
        })
    }, [navigation]);

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
                && !KnownWallets(isTestnet)[opAddress]
                && !isTestnet
            ) && kind !== 'out';

        const canRepeat = kind === 'out'
            && !props.ledger
            && tx.base.parsed.body?.type !== 'payload';

        const handleAction = (eN?: number) => {
            switch (eN) {
                case 1: {
                    onShare(addressLink, t('txActions.share.address'));
                    break;
                }
                case 2: {
                    onAddressContact(Address.parse(opAddress));
                    break;
                }
                case 3: {
                    if (explorerTxLink) {
                        onShare(explorerTxLink, t('txActions.share.transaction'));
                    }
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
            options: [
                t('common.cancel'),
                t('txActions.addressShare'),
                !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'),
                t('txActions.txShare'),
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
                <TransactionListItem
                    {...item}
                    address={props.address}
                    theme={theme}
                    onPress={navigateToPreview}
                    onLongPress={onLongPress}
                    ledger={props.ledger}
                    navigation={navigation}
                    addToDenyList={addToDenyList}
                    spamMinAmount={spamMinAmount}
                    dontShowComments={dontShowComments}
                    denyList={addressBook.denyList}
                    contacts={addressBook.contacts}
                    isTestnet={isTestnet}
                    spamWallets={spamWallets}
                    appState={appState}
                    jettons={props.jettons}
                    bounceableFormat={bounceableFormat}
                />
            )}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.id}
        />
    );
});
WalletTransactions.displayName = 'WalletTransactions';