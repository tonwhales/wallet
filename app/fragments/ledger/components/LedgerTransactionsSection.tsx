import React from "react";
import { View, Text } from "react-native";
import { Address } from "ton";
import { Engine } from "../../../engine/Engine";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { LedgerTransactionView } from "./LedgerTransactionView";
import { useTheme } from '../../../engine/hooks/useTheme';

export const LedgerTransactionsSection = React.memo(({
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
    const theme = useTheme();
    const openTransactionFragment = React.useCallback((transaction: string) => {
        navigation.navigate('LedgerTransactionPreview', {transaction });
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
                    backgroundColor: 'white',
                    overflow: 'hidden'
                }}
                collapsable={false}
            >
                {section.items.map((t, i) => <LedgerTransactionView
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