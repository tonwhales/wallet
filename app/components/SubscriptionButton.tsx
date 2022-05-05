import React from "react"
import { View, Text, Image, Pressable } from "react-native";
import { AddressComponent } from "./AddressComponent";
import { Theme } from "../Theme";
import { useEngine } from "../sync/Engine";
import { ValueComponent } from "./ValueComponent";
import { PriceComponent } from "./PriceComponent";
import { t } from "../i18n/t";
import { formatDate } from "../utils/dates";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { AppConfig } from "../AppConfig";
import { PluginState } from "../sync/account/PluginSync";

export const SubscriptionButton = React.memo((
    {
        address,
        subscription
    }: {
        address: string
        subscription: PluginState
    }
) => {
    const navigation = useTypedNavigation();

    if (subscription.type === 'unknown') {
        return (
            <View style={{
                minHeight: 62, borderRadius: 14,
                backgroundColor: 'white', flexDirection: 'row',
                padding: 10, flex: 1
            }}>
                <View
                    style={{
                        height: 42, width: 42,
                        backgroundColor: 'white',
                        borderRadius: 26,
                        overflow: 'hidden',
                        marginRight: 10
                    }}
                >
                    <View style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: 0, right: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontWeight: '800',
                            fontSize: 18,
                        }}>
                            {'U'}
                        </Text>
                    </View>
                    {/* {!!subscription.icon && (
                    <Image
                    source={subscription.icon}
                    style={{
                        height: 42, width: 42, borderRadius: 10,
                        overflow: 'hidden'
                    }} />
                    )} */}
                    <View style={{
                        borderRadius: 26,
                        borderWidth: 0.5,
                        borderColor: 'black',
                        backgroundColor: 'transparent',
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.06
                    }} />
                </View>
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textColor,
                        fontWeight: '600',
                        flex: 1,
                        marginBottom: 3
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {'Unknown contract'}
                    </Text>
                </View>
            </View>
        );
    }

    const periodFullDays = Math.floor(subscription.state.period / (60 * 60 * 24));
    const nextBilling = subscription.state.lastPayment + subscription.state.period;
    let period = '';
    if (periodFullDays === 30) {
        period = t('products.subscriptions.monthly');
    } else if (periodFullDays > 30) {
        period = t('products.subscriptions.inDays', { count: periodFullDays });
    } else {
        period = t('products.subscriptions.inHours', { count: Math.floor(subscription.state.period / (60 * 60)) });
    }

    return (
        <Pressable
            style={({ pressed }) => {
                return {
                    opacity: pressed ? 0.3 : 1
                }
            }}
            onPress={() => {
                console.log(address);
                navigation.navigate('Subscription', { address });
            }}
        >
            <View style={{
                minHeight: 62, borderRadius: 14,
                backgroundColor: 'white', flexDirection: 'row',
                padding: 10, flex: 1
            }}>
                <View
                    style={{
                        height: 42, width: 42,
                        backgroundColor: 'white',
                        borderRadius: 26,
                        overflow: 'hidden',
                        marginRight: 10
                    }}
                >
                    <View style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: 0, right: 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontWeight: '800',
                            fontSize: 18,
                        }}>
                            {'Sub'}
                        </Text>
                    </View>
                    {/* {!!subscription.icon && (
                    <Image
                    source={subscription.icon}
                    style={{
                        height: 42, width: 42, borderRadius: 10,
                        overflow: 'hidden'
                    }} />
                )} */}
                    <View style={{
                        borderRadius: 26,
                        borderWidth: 0.5,
                        borderColor: 'black',
                        backgroundColor: 'transparent',
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.06
                    }} />
                </View>
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{
                        fontSize: 16,
                        color: Theme.textColor,
                        fontWeight: '600',
                        flex: 1,
                        marginBottom: 3
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        <AddressComponent address={subscription.state.wallet} />
                    </Text>
                    {period!! && period.length > 0 && (
                        <Text style={{
                            fontSize: 13, fontWeight: '400',
                            maxWidth: 150, color: '#787F83'
                        }}>
                            {period}
                        </Text>
                    )}
                    <Text style={{
                        fontSize: 13, fontWeight: '400',
                        maxWidth: 150, color: '#787F83'
                    }}>
                        {t('products.subscriptions.nextBilling') + ': ' + formatDate(nextBilling)}
                    </Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginBottom: 5 }}>
                        <ValueComponent value={subscription.state.amount} /> {' TON'}
                    </Text>
                    <PriceComponent
                        amount={subscription.state.amount}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end', height: 14
                        }}
                        textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                    />
                </View>
            </View>
        </Pressable>
    )
})