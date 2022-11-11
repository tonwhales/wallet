import React from "react";
import { View, Text, Image, useWindowDimensions, TouchableHighlight, ScrollView } from "react-native";
import Animated, { runOnJS, useAnimatedScrollHandler } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano, TonClient4 } from "ton";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../AppConfig";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { Engine, useEngine } from "../../engine/Engine";
import { useLedgerWallet } from "../../engine/LedgerAccountContext";
import { LedgerWalletProduct } from "../../engine/products/LedgerWalletProduct";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { formatDate, getDateKey } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { LedgerTransactionView } from "../wallet/views/LedgerTransactionView";

const WalletTransactions = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    ledgerWalletProduct: LedgerWalletProduct,
    onPress: (tx: string) => void
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
            <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
            </View>
        );
        components.push(
            < View key={'s-' + s.title} style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }
            } collapsable={false} >
                {s.items.map((t, i) => {
                    return (
                        <LedgerTransactionView
                            own={props.address}
                            ledgerWalletProduct={props.ledgerWalletProduct}
                            tx={t}
                            separator={i < s.items.length - 1}
                            key={'tx-' + t}
                            onPress={props.onPress}
                        />
                    );
                })}
            </View >
        );
    }

    // Last
    if (props.next) {
        components.push(
            <View key="prev-loader" style={{ height: 64, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingIndicator simple={true} />
            </View>
        );
    } else {
        components.push(
            <View key="footer" style={{ height: 64 }} />
        );
    }

    return <>{components}</>;
});

export const LedgerApp = React.memo((props: { transport: TonTransport, account: number, address: { address: string, publicKey: Buffer }, tonClient4: TonClient4 }) => {
    const ledgerWallet = useLedgerWallet();
    const safeArea = useSafeAreaInsets();
    const account = ledgerWallet.useAccount();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => Address.parse(props.address.address), [props.address.address]);
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
                console.log('Loading more');
                ledgerWallet.loadMore(prev.lt, prev.hash);
            }
        }
    }, [account?.next ? account.next.lt : null]);

    const onScroll = useAnimatedScrollHandler((event) => {
        // Bottom reached
        if (event.contentSize.height > 0) {
            let bottomOffset = (event.contentSize.height - event.layoutMeasurement.height) - event.contentOffset.y;
            if (bottomOffset < 2000) {
                runOnJS(onReachedEnd)();
            }
        }
    }, [cardHeight, onReachedEnd]);

    const openTransactionFragment = React.useCallback((transaction: string) => {
        if (transaction) {
            navigation.navigate('Transaction', {
                transaction: transaction
            });
        }
    }, [navigation]);

    return (
        <View style={{ flexGrow: 1 }}>
            <Animated.ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    flexBasis: 0,
                    marginBottom: safeArea.bottom
                }}
                onScroll={onScroll}
            >
                <View
                    style={[
                        {
                            marginHorizontal: 16, marginVertical: 16,
                            height: cardHeight,
                        }
                    ]}
                    collapsable={false}
                >
                    <Image
                        source={require('../../../assets/staking_card.png')}
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
                    <Text
                        style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 22, marginLeft: 22 }}
                    >
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
                        value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
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
                    />
                </View>
                <View style={{ flexDirection: 'row', marginHorizontal: 16 }} collapsable={false}>
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => { navigation.navigate('Receive', { addr: props.address.address }); }}
                            underlayColor={Theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', borderRadius: 14 }}>
                        <TouchableHighlight onPress={() => {
                            navigation.navigateLedgerTransfer({
                                transport: props.transport,
                                account: props.account,
                                addr: props.address,
                                balance: account?.balance ?? toNano('0')
                            })
                        }} underlayColor={Theme.selector} style={{ borderRadius: 14 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                <View style={{ backgroundColor: Theme.accent, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={require('../../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
                {!!account && (account.transactions.length > 0) && (
                    <WalletTransactions
                        txs={account.transactions}
                        next={account.next}
                        address={address}
                        ledgerWalletProduct={ledgerWallet}
                        onPress={openTransactionFragment}
                    />
                )}
            </Animated.ScrollView>
        </View>
    );
});