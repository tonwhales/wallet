import React from "react"
import { ScrollView, View, Text, Pressable } from "react-native"
import { useEngine } from "../../../engine/Engine";
import { useAppConfig } from "../../../utils/AppConfigContext";

import IcIn from '../../../../assets//ic-tx-in.svg';
import IcOut from '../../../../assets//ic-tx-out.svg';
import { formatTime } from "../../../utils/dates";

export const HoldersCardTransactions = React.memo(({ id }: { id: string }) => {
    const engine = useEngine();
    const txs = engine.products.holders.useCardsTransactions(id);
    const { Theme } = useAppConfig();

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView>
                {txs?.map((tx, index) => {
                    return (
                        <View key={`card-tx-${id}-${index}`}>
                            <Pressable
                                style={{ paddingHorizontal: 16, paddingVertical: 20 }}
                                onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
                            >
                                <View style={{
                                    alignSelf: 'stretch',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <View style={{
                                        width: 46, height: 46,
                                        borderRadius: 23,
                                        borderWidth: 0, marginRight: 10,
                                        justifyContent: 'center', alignItems: 'center',
                                        backgroundColor: Theme.lightGrey
                                    }}>
                                        <IcOut height={32} width={32} style={{ width: 32, height: 32 }} />
                                    </View>
                                    <View style={{ flex: 1, marginRight: 4 }}>
                                        <Text
                                            style={{ color: Theme.textColor, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                                            ellipsizeMode={'tail'}
                                            numberOfLines={1}
                                        >
                                            {tx.type}
                                        </Text>
                                        <Text
                                            style={{ color: Theme.darkGrey, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                                            ellipsizeMode="middle"
                                            numberOfLines={1}
                                        >
                                            {' • ' + formatTime(tx.time)}
                                        </Text>
                                    </View>
                                    <View style={{}}>
                                        <View style={{ flexGrow: 1 }} />
                                    </View>
                                </View>
                                {/* {!!operation.comment && (
                                    <View style={{
                                        flexShrink: 1, alignSelf: 'flex-end',
                                        backgroundColor: Theme.lightGrey,
                                        marginTop: 8,
                                        paddingHorizontal: 10, paddingVertical: 8,
                                        borderRadius: 10, marginLeft: 46 + 10, height: 36
                                    }}>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                            style={{ color: Theme.textColor, fontSize: 15, maxWidth: 400, lineHeight: 20 }}
                                        >
                                            {operation.comment}
                                        </Text>
                                    </View>
                                )} */}
                            </Pressable>
                        </View>
                    )
                })}
            </ScrollView>
        </View>
    );
});