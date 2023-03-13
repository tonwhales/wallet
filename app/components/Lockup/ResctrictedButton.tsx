import BN from "bn.js";
import React from "react";
import { Pressable, View, Text } from "react-native";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { formatDate } from "../../utils/dates";
import { ItemDivider } from "../ItemDivider";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { Timer } from "./Timer";

export const ResctrictedButton = React.memo(({
    value,
    until,
    onPress,
    withDate
}: {
    value: BN,
    until: number,
    onPress?: () => void,
    withDate?: boolean
}) => {
    return (
        <Pressable
            style={({ pressed }) => {
                return [{
                    opacity: (pressed && !!onPress) ? 0.3 : 1,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    paddingHorizontal: withDate ? 0 : 10,
                    paddingVertical: 12
                }];
            }}
            onPress={onPress}
        >
            {withDate && (
                <View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 7, marginLeft: 6,
                        paddingHorizontal: 10,
                    }}>
                        <View style={{
                            flexDirection: 'column',
                            paddingVertical: 2,
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {t('common.balance')}
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'column',
                            paddingVertical: 2,
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                <ValueComponent
                                    value={value}
                                    precision={3}
                                />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={value}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: undefined,
                                    minHeight: 14
                                }}
                                textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                            />
                        </View>
                    </View>
                    <ItemDivider />
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 3, marginLeft: 6,
                        paddingHorizontal: 10, marginTop: 7
                    }}>
                        <View style={{
                            flexDirection: 'column',
                            paddingVertical: 2,
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {t('products.lockups.unlockDate')}
                            </Text>
                            <Text style={{
                                color: '#8E979D', fontWeight: '400', fontSize: 12
                            }}>
                                {formatDate(until, 'dd.MM.yyyy HH:mm')}
                            </Text>
                        </View>
                        <Timer until={until} />
                    </View>
                </View>
            )}
            {!withDate && (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 3, marginLeft: 6
                }}>
                    <Timer until={until} />
                    <View style={{
                        flexDirection: 'column',
                        paddingVertical: 2,
                    }}>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: Theme.textColor
                        }}>
                            <ValueComponent
                                value={value}
                                precision={3}
                            />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={value}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                marginTop: 2, height: undefined,
                                minHeight: 14
                            }}
                            textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                        />
                    </View>
                </View>
            )}
        </Pressable>
    );
});