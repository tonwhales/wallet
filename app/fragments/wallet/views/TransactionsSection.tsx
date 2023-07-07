import React from "react";
import { View, Text } from "react-native";
import { Address } from "ton";
import { Engine } from "../../../engine/Engine";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { TransactionView } from "./TransactionView";

export const TransactionsSection = React.memo(({
    section,
    navigation,
    address,
    engine
}: {
    section: { title: string, items: string[] },
    navigation: TypedNavigation,
    address: Address,
    engine: Engine,
}) => {
    const openTransactionFragment = React.useCallback((transaction: string) => {
        if (transaction) {
            navigation.navigate('Transaction', { transaction: transaction });
        }
    }, [navigation]);
    return (
        <View style={{backgroundColor: 'white'}}>
            <View
                style={{ marginTop: 8 }}
                collapsable={false}
            >
                <Text
                    style={{
                        fontSize: 17,
                        fontWeight: '600',
                        marginHorizontal: 16,
                        marginVertical: 8,
                        lineHeight: 24
                    }}
                >
                    {section.title}
                </Text>
            </View>
            <View
                key={'s-' + section.title}
                style={{
                    borderRadius: 14,
                    overflow: 'hidden'
                }}
                collapsable={false}
            >
                {section.items.map((t, i) => <TransactionView
                    own={address}
                    engine={engine}
                    tx={t}
                    separator={i < section.items.length - 1}
                    key={'tx-' + t}
                    onPress={openTransactionFragment}
                />)}
            </View>
        </View>
    );
});