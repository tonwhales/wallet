import React from "react";
import { TouchableHighlight, View, Text, ImageSourcePropType, Image } from "react-native";
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
        <TouchableHighlight
            onPress={props.onPress}
            underlayColor={Theme.selector}
            style={{
                height: 106,
                backgroundColor: Theme.lightGrey,
                borderRadius: 20,
            }}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingLeft: props.reverse ? 20 : 0, paddingRight: props.reverse ? 0 : 20 }}>
                {(!!props.illustration && props.reverse) && (
                    <View style={{ height: 74, width: 96, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={props.illustration} style={{ height: 74, width: 96 }} />
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
                                color: Theme.darkGrey,
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
                        <Image source={props.illustration} style={{ height: 74, width: 96 }} />
                    </View>
                )}
            </View>
        </TouchableHighlight>
    );
});