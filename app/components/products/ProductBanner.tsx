import React from "react";
import { View, Text, ImageSourcePropType, Image, Pressable } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";

export const ProductBanner = React.memo((props: {
    onPress?: () => void,
    title: string,
    subtitle?: string,
    illustration?: ImageSourcePropType,
    reverse?: boolean
}) => {
    const { Theme } = useAppConfig();

    return (
        <Pressable
            onPress={props.onPress}
            style={({ pressed }) => {
                return {
                    opacity: pressed ? 0.5 : 1,
                    height: 106,
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                }
            }}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingLeft: props.reverse ? 20 : 0, paddingRight: props.reverse ? 0 : 20 }}>
                {(!!props.illustration && props.reverse) && (
                    <View style={{ height: 74, width: 96, justifyContent: 'center', alignItems: 'center' }}>
                        <Image resizeMode={'contain'} source={props.illustration} style={{ height: 74, width: 96 }} />
                    </View>
                )}
                <View style={{
                    justifyContent: 'space-between', padding: 20,
                    flexGrow: 1, flexShrink: 1
                }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, lineHeight: 24 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {props.title}
                    </Text>
                    {!!props.subtitle && (
                        <Text
                            style={{
                                color: Theme.textSecondary,
                                fontSize: 15,
                                lineHeight: 20,
                                flex: 1, flexShrink: 1
                            }}
                            ellipsizeMode={'tail'}
                        >
                            {props.subtitle}
                        </Text>
                    )}
                </View>
                {(!!props.illustration && !props.reverse) && (
                    <View style={{ height: 74, width: 96, justifyContent: 'center', alignItems: 'center' }}>
                        <Image resizeMode={'contain'} source={props.illustration} style={{ height: 74, width: 96 }} />
                    </View>
                )}
            </View>
        </Pressable>
    );
});