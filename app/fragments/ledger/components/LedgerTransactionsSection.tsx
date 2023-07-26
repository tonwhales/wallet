import React from "react";
import { View, Text } from "react-native";
import { Address } from "ton";
import { Engine } from "../../../engine/Engine";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { LedgerTransactionView } from "./LedgerTransactionView";
import { useAppConfig } from "../../../utils/AppConfigContext";

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
    const { Theme } = useAppConfig();
    const openTransactionFragment = React.useCallback((transaction: string) => {
        navigation.navigate('LedgerTransactionPreview', { transaction });
    }, [navigation]);
    return (
        <View style={{ backgroundColor: 'white' }}>
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