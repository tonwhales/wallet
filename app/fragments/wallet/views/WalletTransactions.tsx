import React, { memo, useCallback, useMemo } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets, Rect } from "react-native-safe-area-context";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { Platform, SectionList, SectionListData, SectionListRenderItemInfo, View, Text, StyleProp, ViewStyle, Insets, PointProp } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TransactionView } from "./TransactionView";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { ThemeType } from "../../../engine/state/theme";
import { TransactionDescription } from '../../../engine/types';
import { AddressContact, useAddressBook } from "../../../engine/hooks/contacts/useAddressBook";
import { useDontShowComments, useNetwork, useServerConfig, useSpamMinAmount } from "../../../engine/hooks";

const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 16 }}>
            <View style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                backgroundColor: theme.background,
                opacity: 0.91,
            }} />
            <Text style={{
                fontSize: 17,
                fontWeight: '600',
                lineHeight: 24, color: theme.textPrimary
            }}>
                {title}
            </Text>
        </View>
    )
});

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
});

export const WalletTransactions = memo((props: {
    txs: TransactionDescription[],
    hasNext: boolean,
    address: Address,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    frameArea: Rect,
    onLoadMore: () => void,
    loading: boolean,
    header?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    sectionedListProps?: {
        contentContainerStyle?: StyleProp<ViewStyle>,
        contentInset?: Insets,
        contentOffset?: PointProp
    },
    ledger?: boolean,
}) => {
    const theme = useTheme();
    const navigation = props.navigation;
    const { isTestnet } = useNetwork();
    const [spamMinAmount,] = useSpamMinAmount();
    const [dontShowComments,] = useDontShowComments();
    const [addressBook, updateAddressBook] = useAddressBook();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];

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
        let sectioned: { title: string, data: TransactionDescription[] }[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].base.time);
            let lastItems: TransactionDescription[] = [];
            let title = formatDate(props.txs[0].base.time);
            sectioned.push({ data: lastItems, title });
            for (let t of props.txs) {
                let time = getDateKey(t.base.time);
                if (lastTime !== time) {
                    lastTime = time;
                    lastItems = [];
                    title = formatDate(t.base.time);
                    sectioned.push({ data: lastItems, title });
                }
                lastItems.push(t);
            }
        }
        return { transactionsSectioned: sectioned };
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
            contentContainerStyle={[
                {
                    paddingTop: Platform.OS === 'android'
                        ? props.safeArea.top + 44
                        : undefined,
                },
                props.sectionedListProps?.contentContainerStyle
            ]}
            sections={transactionsSectioned}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            stickySectionHeadersEnabled={false}
            initialNumToRender={40}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={100}
            getItemLayout={(data, index) => ({ index: index, length: 62, offset: 62 * index })}
            getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={props.header}
            ListFooterComponent={props.hasNext ? (
                <View style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <LoadingIndicator simple />
                </View>
            ) : null}
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
                />
            )}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.id}
        />
    );
});