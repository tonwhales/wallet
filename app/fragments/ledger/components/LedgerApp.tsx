import React, { useCallback } from "react";
import { View, Text, Image, useWindowDimensions, TouchableHighlight, NativeSyntheticEvent, NativeScrollEvent, ScrollView, Platform } from "react-native";
import { EdgeInsets, Rect, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { TonTransport } from "ton-ledger";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { PriceComponent } from "../../../components/PriceComponent";
import { ValueComponent } from "../../../components/ValueComponent";
import { WalletAddress } from "../../../components/WalletAddress";
import { t } from "../../../i18n/t";
import { formatDate, getDateKey } from "../../../utils/dates";
import { TypedNavigation, useTypedNavigation } from "../../../utils/useTypedNavigation";
import { LedgerTransactionsSection } from "./LedgerTransactionsSection";
import { useTheme } from '../../../engine/hooks/useTheme';
import { useLedgerAccount } from '../../../engine/hooks/useLedgerAccount';

const WalletTransactions = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    navigation: TypedNavigation,
    safeArea: EdgeInsets,
    frameArea: Rect,
}) => {
    const transactionsSectioned = React.useMemo(() => {
        let sections: { title: string, items: string[] }[] = [];
        if (props.txs.length > 0) {
            let lastTime: string = getDateKey(props.txs[0].time);
            let lastSection: string[] = [];
            let title = formatDate(props.txs[0].time);
            sections.push({ title, items: lastSection });
            for (let t of props.txs) {
                let time = getDateKey(t.time);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(t.time);
                    sections.push({ title, items: lastSection });
                }
                lastSection.push(t.id);
            }
        }
        return sections;
    }, [props.txs]);

    const components: any[] = [];
    for (let s of transactionsSectioned) {
        components.push(
            <LedgerTransactionsSection
                key={s.title}
                section={s}
                address={props.address}
                engine={props.engine}
                navigation={props.navigation}
            />
        );
    }

    // Last
    if (props.next) {
        components.push(
            <View
                key="prev-loader"
                style={{
                    height: 94,
                    alignSelf: 'stretch',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <LoadingIndicator simple={true} />
            </View>
        );
    } else {
        components.push(
            <View key="footer" style={{ height: 94 }} />
        );
    }

    return (
        <View>
            {components}
        </View>
    );
});

export const LedgerApp = React.memo((props: {
    transport: TonTransport,
    account: number,
    address: { address: string, publicKey: Buffer },
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const frameArea = useSafeAreaFrame();
    const address = React.useMemo(() => Address.parse(props.address.address), [props.address.address]);
    const account = useLedgerAccount();
    const navigation = useTypedNavigation();
    const window = useWindowDimensions();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    const onReachedEnd = React.useMemo(() => {
        let prev = account?.next;
        let called = false;
        return () => {
            if (called) {
                return;
            }
            called = true;
            if (prev) {
                engine.products.ledger.loadMore(address, prev.lt, prev.hash);
            }
        }
    }, [account?.next?.lt ?? null]);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!event) return;
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        if (!layoutMeasurement || !contentOffset || !contentSize) return;

        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000) {
            onReachedEnd();
        }
    }, [onReachedEnd]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                contentInset={{ bottom: 52 }}
                contentOffset={{ y: -(44 + safeArea.top), x: 0 }}
                onScroll={onScroll}
                scrollEventThrottle={26}
                removeClippedSubviews={true}
            >
                <View
                    style={{
                        marginHorizontal: 16, marginVertical: 16,
                        height: cardHeight,
                    }}
                    collapsable={false}
                >
                    <Image
                        source={require('../../../../assets/staking_card.png')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: cardHeight,
                            width: window.width - 32
                        }}
                        resizeMode="stretch"
                        resizeMethod="resize"
                    />
                    <Text style={{
                        fontSize: 14,
                        color: 'white',
                        opacity: 0.8,
                        marginTop: 22,
                        marginLeft: 22
                    }}>
                        {t('wallet.balanceTitle')}
                    </Text>
                    <Text style={{ fontSize: 30, color: 'white', marginHorizontal: 22, fontWeight: '800', height: 40, marginTop: 2 }}>
                        <ValueComponent
                            value={account?.balance ?? toNano('0')}
                            centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }}
                        />
                    </Text>
                    <PriceComponent amount={account?.balance ?? toNano('0')} style={{ marginHorizontal: 22, marginTop: 6 }} />
                    <View style={{ flexGrow: 1 }} />
                    <WalletAddress
                        value={address.toFriendly({ testOnly: isTestnet })}
                        address={address}
                        elipsise
                        style={{
                            marginLeft: 22,
                            marginBottom: 16,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            textAlign: 'left',
                            color: 'white',
                            fontWeight: '500',
                            fontFamily: undefined
                        }}
                        lockActions
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginHorizontal: 16,
                    }}
                    collapsable={false}
                >
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => {
                                navigation.navigate(
                                    'LedgerReceive',
                                    {
                                        addr: props.address.address,
                                        ledger: true
                                    }
                                );
                            }}
                            underlayColor={theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => navigation.navigate('LedgerAssets')}
                            underlayColor={theme.selector} style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
                {(!!account && account.transactions.length > 0) && (
                    <WalletTransactions
                        txs={account.transactions}
                        next={account.next}
                        address={address}
                        engine={engine}
                        navigation={navigation}
                        safeArea={safeArea}
                        frameArea={frameArea}
                    />
                )}
            </ScrollView>
        </View>
    );
});