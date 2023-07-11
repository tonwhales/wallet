import React from "react"
import { ScrollView, View, Text, Pressable } from "react-native"
import { useEngine } from "../../../engine/Engine";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { HoldersCardNotification } from "./HoldersCardNotification";

export const HoldersCardTransactions = React.memo(({ id }: { id: string }) => {
    const engine = useEngine();
    const txs = engine.products.holders.useCardsTransactions(id);
    const { Theme } = useAppConfig();

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView>
                {txs?.map((tx, index) => {
                    return (
                        <HoldersCardNotification
                            key={`card-tx-${id}-${index}`}
                            notification={tx}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
});