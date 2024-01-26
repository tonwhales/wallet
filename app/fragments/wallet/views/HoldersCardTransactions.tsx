import React, { memo, useMemo } from "react"
import { SectionList, View, Text } from "react-native"
import { HoldersCardNotification } from "./HoldersCardNotification";
import { formatDate } from "../../../utils/dates";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { useCardTransactions } from "../../../engine/hooks";
import { Address } from "@ton/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemeType } from "../../../engine/state/theme";
import { Typography } from "../../../components/styles";

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
                    <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 16, marginTop: 24 }}>
                        <Text style={[{color: theme.textPrimary}, Typography.semiBold20_28]}>
                            {title}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
});