import React, { memo, useCallback } from "react";
import { Platform, View, Text, Pressable, SectionList, useWindowDimensions, SectionListRenderItemInfo, SectionListData, ActivityIndicator } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { BlurView } from 'expo-blur';
import { t } from "../../i18n/t";
import { Address } from "@ton/core";
import { formatDate, getDateKey } from "../../utils/dates";
import { RoundButton } from "../../components/RoundButton";
import LottieView from "lottie-react-native";
import { useTheme } from '../../engine/hooks/useTheme';
import { SelectedAccount, useSelectedAccount } from '../../engine/hooks/useSelectedAccount';
import { TransactionDescription, useAccountTransactions } from '../../engine/hooks/useAccountTransactions';
import { useClient4 } from '../../engine/hooks/useClient4';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { TransactionView } from './views/TransactionView';
import { ThemeType } from '../../engine/state/theme';

const SectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View
            style={{ backgroundColor: theme.background, minHeight: 62, maxHeight: 62, justifyContent: 'flex-end', paddingBottom: 4 }}
        >
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginHorizontal: 16,
                    marginVertical: 8,
                    color: theme.textColor
                }}
            >
                {title}
            </Text>
        </View>
    )
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
}) => {
    const theme = useTheme();
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const { transactionsSectioned } = React.useMemo(() => {
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

    const renderItem = useCallback(({ item, section, index }: SectionListRenderItemInfo<TransactionDescription, { title: string }>,) => {
        return (
            <TransactionView
                own={props.address}
                tx={item}
                separator={section.data[index + 1] !== undefined}
                onPress={() => { }}
                theme={theme}
                fontScaleNormal={fontScaleNormal}
            />
        );
    }, [props.address.hash, theme, fontScaleNormal]);

    const renderSectionHeader = useCallback((section: { section: SectionListData<TransactionDescription, { title: string }> }) => (
        <SectionHeader theme={theme} title={section.section.title} />
    ), [theme]);

    return (
        <SectionList
            contentContainerStyle={{
                paddingTop: Platform.OS === 'android'
                    ? props.safeArea.top + 44
                    : undefined,
            }}
            sections={transactionsSectioned}
            contentInset={{ top: 44, bottom: 52 }}
            contentOffset={{ y: -(44 + props.safeArea.top), x: 0 }}
            scrollEventThrottle={26}
            removeClippedSubviews={true}
            stickySectionHeadersEnabled={false}
            initialNumToRender={300}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={100}
            getItemLayout={(data, index) => ({ index: index, length: 62, offset: 62 * index })}
            getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={Platform.OS === 'ios' ? (<View style={{ height: props.safeArea.top }} />) : undefined}
            ListFooterComponent={props.loading ? (
                <View style={{ height: 64, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <LoadingIndicator simple />
                </View>
            ) : (
                props.hasNext ? (<View style={{ height: 64 }} />) : undefined
            )}
            renderItem={renderItem}
            onEndReached={() => props.onLoadMore()}
            onEndReachedThreshold={0.5}
            keyExtractor={(item) => 'tx-' + item.id}
        />
    );
});

function TransactionsComponent(props: { account: SelectedAccount }) {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const navigation = useTypedNavigation();
    const animRef = React.useRef<LottieView>(null);
    const client = useClient4(useNetwork().isTestnet);
    const txs = useAccountTransactions(client, props.account.addressString);
    const transactions = txs?.data;
    const address = props.account.address;

    const onReachedEnd = React.useCallback(() => {
        if (txs?.hasNext) {
            txs?.next();
        }
    }, [txs?.next, txs?.hasNext]);

    if (!transactions) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            {transactions.length === 0 && (
                <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                    <Pressable
                        onPress={() => {
                            animRef.current?.play();
                        }}>
                        <LottieView
                            ref={animRef}
                            source={require('../../../assets/animations/duck.json')}
                            autoPlay={true}
                            loop={false}
                            progress={0.2}
                            style={{ width: 192, height: 192 }}
                        />
                    </Pressable>
                    <Text style={{ fontSize: 16, color: theme.label }}>
                        {t('wallet.empty.message')}
                    </Text>
                    <RoundButton
                        title={t('wallet.empty.receive')}
                        size="normal"
                        display="text"
                        onPress={() => navigation.navigate('Receive')}
                    />
                </View>
            )}
            {transactions.length > 0 && (
                <WalletTransactions
                    txs={transactions}
                    address={address}
                    navigation={navigation}
                    safeArea={safeArea}
                    onLoadMore={onReachedEnd}
                    hasNext={txs.hasNext}
                    frameArea={frameArea}
                    loading={txs.loading}
                />
            )}
            {/* iOS Toolbar */}
            {
                Platform.OS === 'ios' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                    }}>
                        <View style={{ backgroundColor: theme.background, opacity: 0.9, flexGrow: 1 }} />
                        <BlurView style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            paddingTop: safeArea.top,
                            flexDirection: 'row',
                            overflow: 'hidden'
                        }}
                        >
                            <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[
                                    {
                                        fontSize: 22,
                                        color: theme.textColor,
                                        fontWeight: '700',
                                        position: 'relative'
                                    }
                                ]}>
                                    {t('transactions.history')}
                                </Text>
                            </View>
                        </BlurView>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: theme.headerDivider,
                            opacity: 0.08
                        }} />
                    </View >
                )
            }
            {/* Android Toolbar */}
            {
                Platform.OS === 'android' && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: safeArea.top + 44,
                        backgroundColor: theme.background,
                        paddingTop: safeArea.top,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Text style={[
                                {
                                    fontSize: 22,
                                    color: theme.textColor,
                                    fontWeight: '700',
                                    position: 'relative'
                                },
                            ]}>
                                {t('transactions.history')}
                            </Text>
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: 0.5, left: 0, right: 0,
                            height: 0.5,
                            width: '100%',
                            backgroundColor: theme.headerDivider,
                            opacity: 0.08
                        }} />
                    </View>
                )
            }
        </View >
    );
}

export const TransactionsFragment = fragment(() => {
    const account = useSelectedAccount();

    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return (
            <TransactionsComponent account={account} />
        )
    }
}, true);