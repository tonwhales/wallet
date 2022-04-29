import React from "react";
import { ImageSourcePropType, View, Image, Text, Pressable } from "react-native";
import { t } from "../i18n/t";
import { Theme } from "../Theme";

export const ConnectedAppButton = React.memo((
    {
        name,
        url,
        icon,
        key,
        date,
        onPress
    }: {
        name?: string,
        url?: string,
        icon?: ImageSourcePropType,
        key: string,
        date: number,
        onPress?: () => void
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
                    borderRadius: 10,
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
                        {'APP'}
                    </Text>
                </View>
                {!!icon && (
                    <Image
                        source={icon}
                        style={{
                            height: 42, width: 42, borderRadius: 10,
                            overflow: 'hidden'
                        }} />
                )}
                <View style={{
                    borderRadius: 10,
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
                {!!name && (
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
                        {name}
                    </Text>
                )}
                {!!url && (
                    <Text style={{
                        fontSize: 16,
                        color: '#787F83',
                        fontWeight: '400',
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {url}
                    </Text>
                )}
            </View>
            <Pressable
                style={({ pressed }) => {
                    return {
                        marginLeft: 10,
                        opacity: pressed ? 0.3 : 1,
                        height: 42,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                }}
                onPress={onPress}
            >
                <Text
                    style={{
                        fontWeight: '500',
                        color: '#CF3535',
                        fontSize: 16
                    }}
                >
                    {t('auth.revoke.action')}
                </Text>
            </Pressable>
        </View>
    );
})