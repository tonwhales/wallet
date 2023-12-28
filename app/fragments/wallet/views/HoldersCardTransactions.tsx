import React, { memo, useMemo } from "react"
import { SectionList, View, Text } from "react-native"
import { HoldersCardNotification } from "./HoldersCardNotification";
import { formatDate } from "../../../utils/dates";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { useCardTransactions, useNetwork, useTheme } from "../../../engine/hooks";
import { Address } from "@ton/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemeType } from "../../../engine/state/theme";

export const HoldersCardTransactions = memo(({
    id,
    address,
    theme,
    isTestnet
}: {
    id: string,
    address: Address,
    theme: ThemeType,
    isTestnet: boolean
}) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const notificationsState = useCardTransactions(address.toString({ testOnly: isTestnet }), id);
    const notifications = notificationsState?.data;
    const txs = notifications?.pages?.map((p) => p?.data).filter((d) => !!d).flat() as CardNotification[];

    const sections = useMemo(() => {
        const data: Map<string, CardNotification[]> = new Map();
        if (txs && txs.length > 0) {
            let lastDate: string | undefined;
            let lastDateIndex = 0;
            for (let index = 0; index < txs.length; index++) {
                const tx = txs[index];
                const dateKey = formatDate(tx.time / 1000);
                if (lastDate !== dateKey) {
                    lastDate = dateKey;
                    data.set(dateKey, []);
                    lastDateIndex = index;
                }
                data.get(dateKey)?.push(tx);
            }
        }
        return Array.from(data.entries()).map(([title, data]) => ({ title, data }));
    }, [txs]);

    return (
        <View style={{ flexGrow: 1 }}>
            <SectionList
                sections={sections}
                getItemCount={(data) => data.reduce((acc: number, item: { data: any[], title: string }) => acc + item.data.length + 1, 0)}
                keyExtractor={(item, index) => item.id + index}
                onEndReached={() => notificationsState.fetchNextPage()}
                renderItem={({ item }) => (
                    <HoldersCardNotification
                        key={`card-tx-${id}-${item.id}`}
                        notification={item}
                        theme={theme}
                    />
                )}
                initialNumToRender={15}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                stickySectionHeadersEnabled={false}
                onEndReachedThreshold={0.5}
                refreshing={notificationsState.isLoading}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={{ width: '100%', paddingHorizontal: 16, paddingVertical: 8 }}>
                        <View style={{
                            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            backgroundColor: theme.backgroundPrimary,
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
                )}
            />
        </View>
    );
});