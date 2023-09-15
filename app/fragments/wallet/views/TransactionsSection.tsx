import React from "react";
import { View, Text } from "react-native";
import { Address } from "@ton/core";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { TransactionView } from "./TransactionView";
import { useTheme } from '../../../engine/hooks/useTheme';
import { TransactionDescription } from '../../../engine/hooks/useAccountTransactions';
import { StoredTransaction } from '../../../engine/hooks/useRawAccountTransactions';

export const TransactionsSection = React.memo(({
    section,
    navigation,
    address,
}: {
    section: { title: string, items: TransactionDescription[] },
    navigation: TypedNavigation,
    address: Address,
}) => {
    const theme = useTheme();

    const openTransactionFragment = React.useCallback((transaction: TransactionDescription) => {
        if (transaction) {
            navigation.navigate('Transaction', { transaction: transaction });
        }
    }, [navigation]);

    return (
        <View>
            <View
                style={{ marginTop: 8, backgroundColor: theme.background }}
                collapsable={false}
            >
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginHorizontal: 16,
                        marginVertical: 8
                    }}
                >
                    {section.title}
                </Text>
            </View>
            <View
                key={'s-' + section.title}
                style={{
                    marginHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: theme.item,
                    overflow: 'hidden'
                }}
                collapsable={false}
            >
                {section.items.map((t, i) => (
                    <TransactionView
                        own={address}
                        tx={t}
                        separator={i < section.items.length - 1}
                        key={'tx-' + t.id}
                        onPress={openTransactionFragment}
                        fontScaleNormal={true}
                        theme={theme}
                    />
                ))}
            </View>
        </View>
    );
});