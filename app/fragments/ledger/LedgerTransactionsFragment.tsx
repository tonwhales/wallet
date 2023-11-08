import { NativeScrollEvent, NativeSyntheticEvent, View, ScrollView } from "react-native";
import { fragment } from "../../fragment";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import React, { memo, useCallback, useMemo } from "react";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { TabHeader } from "../../components/topbar/TabHeader";
import { t } from "../../i18n/t";
import { formatDate, getDateKey } from "../../utils/dates";
import { LoadingIndicator } from "../../components/LoadingIndicator";

// const WalletTransactions = memo((props: {
//     txs: { id: string, time: number }[],
//     next: { lt: string, hash: string } | null,
//     address: Address,
//     engine: Engine,
//     navigation: TypedNavigation,
//     safeArea: EdgeInsets
// }) => {
//     const transactionsSectioned = useMemo(() => {
//         let sections: { title: string, items: string[] }[] = [];
//         if (props.txs.length > 0) {
//             let lastTime: string = getDateKey(props.txs[0].time);
//             let lastSection: string[] = [];
//             let title = formatDate(props.txs[0].time);
//             sections.push({ title, items: lastSection });
//             for (let t of props.txs) {
//                 let time = getDateKey(t.time);
//                 if (lastTime !== time) {
//                     lastSection = [];
//                     lastTime = time;
//                     title = formatDate(t.time);
//                     sections.push({ title, items: lastSection });
//                 }
//                 lastSection.push(t.id);
//             }
//         }
//         return sections;
//     }, [props.txs]);

//     const components: any[] = [];
//     for (let s of transactionsSectioned) {
//         components.push(
//             <LedgerTransactionsSection
//                 key={s.title}
//                 section={s}
//                 address={props.address}
//                 engine={props.engine}
//                 navigation={props.navigation}
//             />
//         );
//     }

//     // Last
//     if (props.next) {
//         components.push(
//             <View
//                 key="prev-loader"
//                 style={{
//                     height: 94,
//                     alignSelf: 'stretch',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                 }}
//             >
//                 <LoadingIndicator simple={true} />
//             </View>
//         );
//     }

//     return (
//         <View>
//             {components}
//         </View>
//     );
// });

export const LedgerTransactionsFragment = fragment(() => {
    // TODO;
    return null
    // const safeArea = useSafeAreaInsets();
    // const engine = useEngine();
    // const ledgerContext = useLedgerTransport();
    // const address = useMemo(() => {
    //     if (!ledgerContext?.addr) {
    //         return null;
    //     }
    //     try {
    //         const parsed = Address.parse(ledgerContext.addr.address);
    //         return parsed;
    //     } catch (e) {
    //         return null;
    //     }
    // }, [ledgerContext?.addr?.address]);
    // const account = engine.products.ledger.useAccount();
    // const navigation = useTypedNavigation();

    // const onReachedEnd = useMemo(() => {
    //     let prev = account?.next;
    //     let called = false;
    //     return () => {
    //         if (called) {
    //             return;
    //         }
    //         called = true;
    //         if (prev && address) {
    //             engine.products.ledger.loadMore(address, prev.lt, prev.hash);
    //         }
    //     }
    // }, [account?.next?.lt ?? null]);

    // const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    //     if (!event) return;
    //     const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    //     if (!layoutMeasurement || !contentOffset || !contentSize) return;

    //     if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000) {
    //         onReachedEnd();
    //     }
    // }, [onReachedEnd]);

    // return (
    //     <View style={{ flex: 1 }}>
    //         <TabHeader title={t('transactions.history')} />
    //         <ScrollView
    //             contentContainerStyle={{ flexGrow: 1 }}
    //             onScroll={onScroll}
    //             scrollEventThrottle={26}
    //             removeClippedSubviews={true}
    //         >
    //             {(!account || !address || account.transactions.length === 0) ? (
    //                 <TransactionsEmptyState isLedger />
    //             ) : (
    //                 <WalletTransactions
    //                     txs={account.transactions}
    //                     next={account.next}
    //                     address={address}
    //                     engine={engine}
    //                     navigation={navigation}
    //                     safeArea={safeArea}
    //                 />
    //             )}
    //         </ScrollView>
    //     </View>
    // );
})