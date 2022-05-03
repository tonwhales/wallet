import React from "react"
import { View, Text, Image } from "react-native";
import { Subscription } from '../sync/fetchSubscriptions';
import { AddressComponent } from "../components/AddressComponent";
import { Theme } from "../Theme";

export const SubsciptionButton = React.memo((
    {
        subscription
    }: {
        subscription: Subscription
    }
) => {
    return (
        <View style={{
            height: 62, borderRadius: 14,
            backgroundColor: 'white', flexDirection: 'row',
            alignItems: 'center',
            padding: 10
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
                    height: 42
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
                    <AddressComponent address={subscription.address} />
                </Text>
                {/* {!!subscription.name && (
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
                        {subscription.name}
                    </Text>
                )} */}
                {/* {!!subscription.url && (
                    <Text style={{
                        fontSize: 16,
                        color: '#787F83',
                        fontWeight: '400',
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {subscription.url}
                    </Text>
                )} */}
            </View>
        </View>
    )
})