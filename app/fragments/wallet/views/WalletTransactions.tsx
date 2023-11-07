import React, { memo, useCallback, useMemo } from "react";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { EdgeInsets, Rect } from "react-native-safe-area-context";
import { useTheme } from "../../../engine/hooks/theme/useTheme";
import { Platform, SectionList, SectionListData, SectionListRenderItemInfo, View, Text, useWindowDimensions, StyleProp, ViewStyle, Insets, PointProp } from "react-native";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TransactionView } from "./TransactionView";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { ThemeType } from "../../../engine/state/theme";
import { TransactionDescription } from '../../../engine/types';

const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View
            style={{
                backgroundColor: theme.background,
                justifyContent: 'flex-end',
                paddingBottom: 2,
                paddingTop: 12,
                marginHorizontal: 16,
                marginVertical: 8,
            }}
        >
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: theme.textColor
                }}
            >
                {title}
            </Text>
        </View>
    )
});

type TransactionListItemProps = {
    address: Address,
    theme: ThemeType,
    onPress: (tx: TransactionDescription) => void,
    fontScaleNormal: boolean,
}
const TransactionListItem = memo(({ item, section, index, theme, ...props }: SectionListRenderItemInfo<TransactionDescription, { title: string }> & TransactionListItemProps) => {
    return (
        <View style={[
            {
                marginHorizontal: 16,
                overflow: 'hidden',
            },
            index === 0 ? { borderTopStartRadius: 21, borderTopEndRadius: 21 } : {},
            section.data[index + 1] === undefined ? { borderBottomStartRadius: 21, borderBottomEndRadius: 21 } : {},
        ]}>
            <TransactionView
                own={props.address}
                tx={item}
                separator={section.data[index + 1] !== undefined}
                onPress={props.onPress}
                theme={theme}
                fontScaleNormal={props.fontScaleNormal}
            />
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id 
            && prevProps.fontScaleNormal === nextProps.fontScaleNormal 
            && prevProps.theme === nextProps.theme 
            && nextProps.index === prevProps.index
            && (prevProps.section.data[prevProps.index + 1] === nextProps.section.data[nextProps.index + 1]);
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
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

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

    const headerComponent = useMemo(() => {
        if (!props.header) {
            return Platform.OS === 'ios' ? (<View style={{ height: props.safeArea.top }} />) : undefined;
        }
        return props.header;
    }, [props.header]);

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
            contentInset={props.sectionedListProps?.contentInset || { top: 44, bottom: 52 }}
            contentOffset={props.sectionedListProps?.contentOffset || { y: -(44 + props.safeArea.top), x: 0 }}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            stickySectionHeadersEnabled={false}
            initialNumToRender={300}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={100}
            getItemLayout={(data, index) => ({ index: index, length: 62, offset: 62 * index })}
            getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={headerComponent}
            ListFooterComponent={props.hasNext ? (
                <View style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <LoadingIndicator simple />
                </View>
            ) : null}
            renderItem={(item) => <TransactionListItem {...item} address={props.address} theme={theme} onPress={navigateToPreview} fontScaleNormal={fontScaleNormal} />}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={1}
            keyExtractor={(item) => 'tx-' + item.id}
        />
    );
});