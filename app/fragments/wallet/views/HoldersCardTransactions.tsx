import React, { memo, useMemo } from "react"
import { SectionList, View, Text } from "react-native"
import { useEngine } from "../../../engine/Engine";
import { HoldersCardNotification } from "./HoldersCardNotification";
import { formatDate } from "../../../utils/dates";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useCardTransactions } from "../../../engine/holders/useHoldersCardTransactions";

export const HoldersCardTransactions = memo(({ id }: { id: string }) => {
    const engine = useEngine();
    const { Theme } = useAppConfig();
    const { loadMore, loading, history } = useCardTransactions(engine, id);
    const txs = history.txs

    const sections = useMemo(() => {
        const data: { title: string, data: CardNotification[] }[] = [];
        if (txs && txs.length > 0) {
            let lastDate: string | undefined;
            let lastDateIndex = 0;
            txs.forEach((tx, index) => {
                const dateKey = formatDate(tx.time / 1000);
                if (lastDate !== dateKey) {
                    lastDate = dateKey;
                    data.push({ title: dateKey, data: [] });
                    lastDateIndex = index;
                }
                data[data.length - 1].data.push(tx);
            });

        }
        return data;
    }, [txs]);

    return (
        <View style={{ flexGrow: 1 }}>
            <SectionList
                sections={sections}
                getItemCount={(data) => data.items.length}
                keyExtractor={(item, index) => item.id + index}
                onEndReached={loadMore}
                renderItem={({ item }) => (
                    <HoldersCardNotification
                        key={`card-tx-${id}-${item.id}`}
                        notification={item}
                    />
                )}
                stickySectionHeadersEnabled={false}
                onEndReachedThreshold={0.5}
                refreshing={loading}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={{ width: '100%', paddingHorizontal: 16, paddingVertical: 8 }}>
                        <View style={{
                            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            backgroundColor: Theme.background,
                            opacity: 0.91,
                        }} />
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            lineHeight: 24, color: Theme.textPrimary
                        }}>
                            {title}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
});