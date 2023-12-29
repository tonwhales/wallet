import React, { memo, useCallback, useMemo } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { SectionList, SectionListData, SectionListRenderItemInfo, View, Text, StyleProp, ViewStyle, Insets, PointProp } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TransactionView } from "./TransactionView";
import { ThemeType } from "../../../engine/state/theme";
import { TransactionDescription } from '../../../engine/types';
import { AddressContact, useAddressBook } from "../../../engine/hooks/contacts/useAddressBook";
import { useAppState, useDontShowComments, useNetwork, useServerConfig, useSpamMinAmount } from "../../../engine/hooks";
import { TransactionsEmptyState } from "./TransactionsEmptyStateView";
import { TransactionsSkeleton } from "../../../components/skeletons/TransactionsSkeleton";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { AppState } from "../../../storage/appState";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";

const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{
                fontSize: 20,
                fontWeight: '600',
                lineHeight: 28, color: theme.textPrimary
            }}>
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
    showActionSheetWithOptions?: (options: ActionSheetOptions, callback: (i?: number | undefined) => void | Promise<void>) => void,
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
        && prev.spamWallets === next.spamWallets
        && prev.appState === next.appState
        && prev.showActionSheetWithOptions === next.showActionSheetWithOptions;
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

    return (
        <SectionList
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
                    showActionSheetWithOptions={showActionSheetWithOptions}
                />
            )}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.id}
        />
    );
});
WalletTransactions.displayName = 'WalletTransactions';